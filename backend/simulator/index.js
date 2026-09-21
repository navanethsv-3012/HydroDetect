import simulator from './Simulator.js';

/**
 * Start the simulator if SIMULATOR_ENABLED is true.
 * Called from server.js after MongoDB and Socket.IO are ready.
 *
 * @param {Object} io - Socket.IO server instance
 */
export const startSimulator = async (io) => {
  const enabled = process.env.SIMULATOR_ENABLED === 'true';

  if (!enabled) {
    console.log('[SIMULATOR] Disabled via SIMULATOR_ENABLED=false');
    return;
  }

  try {
    await simulator.start(io);
  } catch (error) {
    console.error('[SIMULATOR] Failed to start:', error.message);
  }
};

export const stopSimulator = () => {
  simulator.stop();
};

export { simulator };
export default { startSimulator, stopSimulator, simulator };
