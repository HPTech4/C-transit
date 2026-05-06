'use strict';
import { prisma } from '../services/ledger.service.js';
import { flushTerminalQueue } from '../services/sync.service.js';
import logger from '../config/logger.js';

async function handleLwtEvent(terminalId, statusPayload) {
  const status = statusPayload.trim().toUpperCase();
  const log = logger.child({ terminalId, status });

  if (status !== "ONLINE" && status !== "OFFLINE") {
    log.warn(
      { rawPayload: statusPayload },
      "lwt.unknown_status_payload — ignoring"
    );
    return;
  }

  try {
    await prisma.terminal.upsert({
      where: { terminal_id: terminalId },
      update: {
        status,
        last_seen: new Date(),
      },
      create: {
        terminal_id: terminalId,
        status,
        last_seen: new Date(),
        secret_key: 'UNPROVISIONED',
      },
    });
    log.info('lwt.terminal_status_updated');
    if (status === 'ONLINE') {
      log.info('lwt.terminal_online — flushing redis queue');
      flushTerminalQueue(terminalId).catch((err) => {
        log.error({ err: err.message }, 'lwt.queue_flush_error');
      });
    } else {
      log.info('lwt.terminal_offline — status locked in db');
    }
  } catch (err) {
    log.error({ err: err.message }, 'lwt.db_update_error');
  }
}
export { handleLwtEvent };
