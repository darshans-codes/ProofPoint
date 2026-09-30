import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  clearSessionCookie,
  requireAuth,
  setSessionCookie,
  signSession,
} from '../middleware/auth.js';

const googleClient = new OAuth2Client();

function publicUser(user) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    role: user.role,
  };
}

export const loginWithGoogle = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  const audience = process.env.GOOGLE_CLIENT_ID;
  if (!audience) {
    return res.status(503).json({ error: 'Google sign-in is not configured.' });
  }
  if (!credential || typeof credential !== 'string') {
    return res.status(400).json({ error: 'Google credential is required.' });
  }

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({ idToken: credential, audience });
  } catch {
    return res.status(401).json({ error: 'Google credential is invalid or expired.' });
  }
  const payload = ticket.getPayload();
  if (
    !payload?.sub ||
    !payload.email ||
    payload.email_verified !== true ||
    payload.iss !== 'https://accounts.google.com'
  ) {
    return res.status(401).json({ error: 'Google identity could not be verified.' });
  }

  const user = await User.findOneAndUpdate(
    { googleSub: payload.sub },
    {
      $set: {
        email: payload.email,
        name: payload.name || payload.email,
        picture: payload.picture || '',
        lastLoginAt: new Date(),
      },
      $setOnInsert: { role: 'user' },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  setSessionCookie(res, signSession(user));
  res.json({ user: publicUser(user) });
});

export const loginAsGuest = asyncHandler(async (req, res) => {
  let user;
  try {
    user = await User.findOneAndUpdate(
      { googleSub: 'demo-guest-user-sub' },
      {
        $set: {
          email: 'investigator@proofpoint.local',
          name: 'Field Investigator (Demo)',
          picture: '',
          lastLoginAt: new Date(),
        },
        $setOnInsert: { role: 'user' },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  } catch {
    // Resilient fallback when Mongo is running in degraded mode
    user = {
      _id: '000000000000000000000001',
      email: 'investigator@proofpoint.local',
      name: 'Field Investigator (Demo)',
      picture: '',
      role: 'user',
    };
  }

  setSessionCookie(res, signSession(user));
  res.json({ user: publicUser(user) });
});

export const getMe = asyncHandler(async (req, res) => {
  if (!req.auth?.sub) return res.json({ user: null });
  let user = null;
  try {
    user = await User.findById(req.auth.sub).select('_id email name picture role');
  } catch {
    // Ignore db find error on mock sub
  }
  if (!user && (req.auth.sub === '000000000000000000000001' || req.auth.sub === 'demo_user')) {
    user = {
      _id: req.auth.sub,
      email: 'investigator@proofpoint.local',
      name: 'Field Investigator (Demo)',
      picture: '',
      role: req.auth.role || 'user',
    };
  }
  if (!user) return res.json({ user: null });
  res.json({ user: publicUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

export { requireAuth };
