/**
 * Session Tracking API Endpoint
 * Handles session tracking for user interactions and analytics
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { InteractionTypes, SessionStates } from '../../lib/sessionManager.js';

// In-memory session storage (in production, use a database)
const sessions = new Map();
const interactions = new Map();

// Session configuration
const SESSION_CONFIG = {
  maxSessions: 1000, // Limit memory usage
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  maxInteractionsPerSession: 100,
  cleanupInterval: 5 * 60 * 1000 // 5 minutes
};

// Valid interaction types for validation
const VALID_INTERACTION_TYPES = Object.values(InteractionTypes);
const VALID_SESSION_STATES = Object.values(SessionStates);

/**
 * Session Tracking API Handler
 * @param {NextApiRequest} req - API request
 * @param {NextApiResponse} res - API response
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Route based on HTTP method and action
    switch (req.method) {
      case 'POST':
        await handleCreateSession(req, res);
        break;
      case 'PUT':
        await handleUpdateSession(req, res);
        break;
      case 'GET':
        await handleGetSession(req, res);
        break;
      case 'DELETE':
        await handleDeleteSession(req, res);
        break;
      default:
        res.status(405).json({ 
          error: 'Method not allowed',
          allowed: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
        });
    }
  } catch (error) {
    console.error('Session API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Session operation failed'
    });
  }
}

/**
 * Create new session
 */
async function handleCreateSession(req, res) {
  const { sessionData = {}, initialInteraction = null } = req.body;

  // Generate session ID
  const sessionId = generateSessionId();
  const now = new Date();

  // Create session record
  const session = {
    sessionId,
    state: SessionStates.ACTIVE,
    startTime: now.toISOString(),
    lastActivity: now.toISOString(),
    userAgent: req.headers['user-agent'] || 'Unknown',
    ip: getClientIP(req),
    language: req.headers['accept-language']?.split(',')[0] || 'Unknown',
    ...sessionData
  };

  // Store session
  sessions.set(sessionId, session);

  // Initialize interactions array for this session
  interactions.set(sessionId, []);

  // Add initial interaction if provided
  if (initialInteraction) {
    await addInteractionToSession(sessionId, {
      type: InteractionTypes.PAGE_VISIT,
      ...initialInteraction
    });
  }

  // Cleanup old sessions
  cleanupOldSessions();

  res.status(201).json({
    success: true,
    sessionId,
    session,
    message: 'Session created successfully'
  });
}

/**
 * Update existing session or add interaction
 */
async function handleUpdateSession(req, res) {
  const { sessionId } = req.query;
  const { action, data } = req.body;

  if (!sessionId) {
    res.status(400).json({ error: 'Session ID required' });
    return;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  switch (action) {
    case 'add_interaction':
      await handleAddInteraction(sessionId, data, res);
      break;
    case 'update_state':
      await handleUpdateSessionState(sessionId, data, res);
      break;
    case 'heartbeat':
      await handleHeartbeat(sessionId, res);
      break;
    default:
      res.status(400).json({ 
        error: 'Invalid action',
        validActions: ['add_interaction', 'update_state', 'heartbeat']
      });
  }
}

/**
 * Get session data
 */
async function handleGetSession(req, res) {
  const { sessionId, includeInteractions = 'true', limit = '50' } = req.query;

  if (!sessionId) {
    res.status(400).json({ error: 'Session ID required' });
    return;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const response = {
    session,
    stats: calculateSessionStats(sessionId)
  };

  // Include interactions if requested
  if (includeInteractions === 'true') {
    const sessionInteractions = interactions.get(sessionId) || [];
    const limitNum = parseInt(limit, 10);
    response.interactions = sessionInteractions.slice(-limitNum);
    response.interactionCount = sessionInteractions.length;
  }

  res.status(200).json(response);
}

/**
 * Delete session
 */
async function handleDeleteSession(req, res) {
  const { sessionId } = req.query;

  if (!sessionId) {
    res.status(400).json({ error: 'Session ID required' });
    return;
  }

  const deleted = sessions.delete(sessionId);
  interactions.delete(sessionId);

  if (deleted) {
    res.status(200).json({ 
      success: true,
      message: 'Session deleted successfully'
    });
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
}

/**
 * Add interaction to session
 */
async function handleAddInteraction(sessionId, interactionData, res) {
  const { type, data = {} } = interactionData;

  // Validate interaction type
  if (!VALID_INTERACTION_TYPES.includes(type)) {
    res.status(400).json({ 
      error: 'Invalid interaction type',
      validTypes: VALID_INTERACTION_TYPES
    });
    return;
  }

  const interaction = await addInteractionToSession(sessionId, interactionData);

  res.status(200).json({
    success: true,
    interaction,
    message: 'Interaction recorded successfully'
  });
}

/**
 * Update session state
 */
async function handleUpdateSessionState(sessionId, stateData, res) {
  const { state, ...updateData } = stateData;

  const session = sessions.get(sessionId);
  
  // Validate state if provided
  if (state && !VALID_SESSION_STATES.includes(state)) {
    res.status(400).json({ 
      error: 'Invalid session state',
      validStates: VALID_SESSION_STATES
    });
    return;
  }

  // Update session
  const updatedSession = {
    ...session,
    ...updateData,
    lastActivity: new Date().toISOString()
  };

  if (state) {
    updatedSession.state = state;
  }

  sessions.set(sessionId, updatedSession);

  res.status(200).json({
    success: true,
    session: updatedSession,
    message: 'Session updated successfully'
  });
}

/**
 * Handle session heartbeat (keep-alive)
 */
async function handleHeartbeat(sessionId, res) {
  const session = sessions.get(sessionId);
  
  session.lastActivity = new Date().toISOString();
  sessions.set(sessionId, session);

  res.status(200).json({
    success: true,
    sessionId,
    lastActivity: session.lastActivity,
    message: 'Heartbeat recorded'
  });
}

/**
 * Add interaction to session storage
 */
async function addInteractionToSession(sessionId, interactionData) {
  const { type, data = {} } = interactionData;
  
  const interaction = {
    id: generateInteractionId(),
    sessionId,
    type,
    timestamp: new Date().toISOString(),
    data,
    userAgent: data.userAgent || 'Unknown',
    url: data.url || 'Unknown'
  };

  // Get or create interactions array for session
  let sessionInteractions = interactions.get(sessionId) || [];
  
  // Add new interaction
  sessionInteractions.push(interaction);
  
  // Limit interactions per session
  if (sessionInteractions.length > SESSION_CONFIG.maxInteractionsPerSession) {
    sessionInteractions = sessionInteractions.slice(-SESSION_CONFIG.maxInteractionsPerSession);
  }
  
  // Update storage
  interactions.set(sessionId, sessionInteractions);
  
  // Update session last activity
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivity = interaction.timestamp;
    sessions.set(sessionId, session);
  }

  return interaction;
}

/**
 * Calculate session statistics
 */
function calculateSessionStats(sessionId) {
  const session = sessions.get(sessionId);
  const sessionInteractions = interactions.get(sessionId) || [];

  if (!session) return null;

  const now = new Date();
  const startTime = new Date(session.startTime);
  const lastActivity = new Date(session.lastActivity);

  const stats = {
    sessionId,
    duration: now - startTime,
    timeSinceLastActivity: now - lastActivity,
    interactionCount: sessionInteractions.length,
    state: session.state,
    isActive: (now - lastActivity) < SESSION_CONFIG.sessionTimeout
  };

  // Count interaction types
  stats.interactionTypes = {};
  sessionInteractions.forEach(interaction => {
    stats.interactionTypes[interaction.type] = (stats.interactionTypes[interaction.type] || 0) + 1;
  });

  // Calculate engagement metrics
  stats.avgTimeBetweenInteractions = sessionInteractions.length > 1 ? 
    stats.duration / (sessionInteractions.length - 1) : 0;

  return stats;
}

/**
 * Generate unique session ID
 */
function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique interaction ID
 */
function generateInteractionId() {
  return `int_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Get client IP address
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'Unknown';
}

/**
 * Cleanup old sessions
 */
function cleanupOldSessions() {
  const now = new Date();
  const cutoff = now - SESSION_CONFIG.sessionTimeout;

  for (const [sessionId, session] of sessions.entries()) {
    const lastActivity = new Date(session.lastActivity);
    
    if (lastActivity < cutoff) {
      sessions.delete(sessionId);
      interactions.delete(sessionId);
    }
  }

  // Also limit total sessions
  if (sessions.size > SESSION_CONFIG.maxSessions) {
    const sortedSessions = Array.from(sessions.entries())
      .sort(([,a], [,b]) => new Date(a.lastActivity) - new Date(b.lastActivity));
    
    const toDelete = sortedSessions.slice(0, sessions.size - SESSION_CONFIG.maxSessions);
    toDelete.forEach(([sessionId]) => {
      sessions.delete(sessionId);
      interactions.delete(sessionId);
    });
  }
}

/**
 * Get API statistics
 */
export function getAPIStats() {
  return {
    activeSessions: sessions.size,
    totalInteractions: Array.from(interactions.values()).reduce((sum, arr) => sum + arr.length, 0),
    config: SESSION_CONFIG,
    uptime: process.uptime()
  };
}

// Start cleanup interval
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldSessions, SESSION_CONFIG.cleanupInterval);
}