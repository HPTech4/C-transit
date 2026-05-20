#include <Arduino.h>
#include <LittleFS.h>

// ─────────────────────────────────────────
//  FILE PATHS  (SAD Section 2)
// ─────────────────────────────────────────
#define FILE_WHITELIST  "/wl.dat"
#define FILE_BLACKLIST  "/bl.dat"
#define FILE_TX_LOG     "/tx.log"
#define FILE_SESSION    "/sess.dat"
#define FILE_SYNC       "/sync.dat"
#define FILE_DRIVERS    "/drv.dat"
#define FILE_ADMINS     "/adm.dat"

#define TX_LOG_MAX_LINES 2000
#define LINE_BUF_SIZE    64   // max chars in any single CSV line

// ─────────────────────────────────────────
//  1. createFilesIfMissing()
//  Creates all required files on first boot
//  if they don't already exist.
// ─────────────────────────────────────────
void createFilesIfMissing() {
  const char* files[] = {
    FILE_WHITELIST, FILE_BLACKLIST, FILE_TX_LOG,
    FILE_SESSION,   FILE_SYNC,      FILE_DRIVERS, FILE_ADMINS
  };

  for (int i = 0; i < 7; i++) {
    if (!LittleFS.exists(files[i])) {
      File f = LittleFS.open(files[i], "w");
      if (f) {
        // sess.dat needs a default state on first boot
        if (strcmp(files[i], FILE_SESSION) == 0) {
          f.println("0,NONE");
        }
        f.close();
        Serial.printf("[FS]  Created %s\n", files[i]);
      } else {
        Serial.printf("[FS]  ERROR: could not create %s\n", files[i]);
      }
    } else {
      Serial.printf("[FS]  Found   %s\n", files[i]);
    }
  }
}

// ─────────────────────────────────────────
//  2. isUIDInFile(path, uid)
//  Buffered line-by-line search.
//  Returns true if uid appears as a line.
//  SAD: never load full file into RAM.
// ─────────────────────────────────────────
bool isUIDInFile(const char* path, const char* uid) {
  File f = LittleFS.open(path, "r");
  if (!f) {
    Serial.printf("[FS]  ERROR: cannot open %s for read\n", path);
    return false;
  }

  char lineBuf[LINE_BUF_SIZE];
  bool found = false;

  while (f.available()) {
    int len = 0;
    // Read one line into fixed buffer
    while (f.available() && len < LINE_BUF_SIZE - 1) {
      char c = f.read();
      if (c == '\n') break;
      if (c == '\r') continue; // skip CR on Windows line endings
      lineBuf[len++] = c;
    }
    lineBuf[len] = '\0';
    if (len == 0) continue;

    if (strcmp(lineBuf, uid) == 0) {
      found = true;
      break;
    }
  }

  f.close();
  return found;
}

// ─────────────────────────────────────────
//  3. appendLineToFile(path, line)
//  Appends a single CSV row + newline.
// ─────────────────────────────────────────
bool appendLineToFile(const char* path, const char* line) {
  File f = LittleFS.open(path, "a");
  if (!f) {
    Serial.printf("[FS]  ERROR: cannot open %s for append\n", path);
    return false;
  }
  f.println(line);
  f.close();
  return true;
}

// ─────────────────────────────────────────
//  4. countLinesInFile(path)
//  Returns total line count.
//  Used for tx.log capacity failsafe.
// ─────────────────────────────────────────
int countLinesInFile(const char* path) {
  File f = LittleFS.open(path, "r");
  if (!f) return 0;

  int count = 0;
  char lineBuf[LINE_BUF_SIZE];

  while (f.available()) {
    int len = 0;
    while (f.available() && len < LINE_BUF_SIZE - 1) {
      char c = f.read();
      if (c == '\n') break;
      if (c == '\r') continue;
      lineBuf[len++] = c;
    }
    lineBuf[len] = '\0';
    if (len > 0) count++;
  }

  f.close();
  return count;
}

// ─────────────────────────────────────────
//  5. countUIDInTxLog(uid)
//  Counts how many times a UID appears
//  in tx.log (for the lookback limit check).
//  SAD Section 4.1 Step 5: reject if >= 2.
// ─────────────────────────────────────────
int countUIDInTxLog(const char* uid) {
  File f = LittleFS.open(FILE_TX_LOG, "r");
  if (!f) return 0;

  int count = 0;
  char lineBuf[LINE_BUF_SIZE];

  while (f.available()) {
    int len = 0;
    while (f.available() && len < LINE_BUF_SIZE - 1) {
      char c = f.read();
      if (c == '\n') break;
      if (c == '\r') continue;
      lineBuf[len++] = c;
    }
    lineBuf[len] = '\0';
    if (len == 0) continue;

    // tx.log format: [UID],[AMOUNT],[TIMESTAMP],[DRIVER_UID]
    // UID is everything before the first comma
    char lineUID[16];
    int i = 0;
    while (lineBuf[i] != ',' && lineBuf[i] != '\0' && i < 15) {
      lineUID[i] = lineBuf[i];
      i++;
    }
    lineUID[i] = '\0';

    if (strcmp(lineUID, uid) == 0) count++;
  }

  f.close();
  return count;
}

// ─────────────────────────────────────────
//  6. removeUIDFromFile(path, uid)
//  Rewrites the file skipping any line
//  that matches uid exactly.
//  Used by differential sync REM: commands.
// ─────────────────────────────────────────
bool removeUIDFromFile(const char* path, const char* uid) {
  // Write filtered content to a temp file
  const char* tmpPath = "/tmp.dat";
  File src = LittleFS.open(path, "r");
  File dst = LittleFS.open(tmpPath, "w");

  if (!src || !dst) {
    Serial.printf("[FS]  ERROR: removeUID could not open files for %s\n", path);
    if (src) src.close();
    if (dst) dst.close();
    return false;
  }

  char lineBuf[LINE_BUF_SIZE];
  bool removed = false;

  while (src.available()) {
    int len = 0;
    while (src.available() && len < LINE_BUF_SIZE - 1) {
      char c = src.read();
      if (c == '\n') break;
      if (c == '\r') continue;
      lineBuf[len++] = c;
    }
    lineBuf[len] = '\0';
    if (len == 0) continue;

    if (strcmp(lineBuf, uid) == 0) {
      removed = true;   // skip this line
      continue;
    }
    dst.println(lineBuf);
  }

  src.close();
  dst.close();

  // Replace original with filtered temp file
  LittleFS.remove(path);
  LittleFS.rename(tmpPath, path);

  Serial.printf("[FS]  removeUID: %s from %s — %s\n",
    uid, path, removed ? "removed" : "not found");
  return removed;
}

// ─────────────────────────────────────────
//  7. readSyncTimestamp()
//  Reads the single Unix timestamp from
//  sync.dat. Returns 0 if missing/empty.
// ─────────────────────────────────────────
uint32_t readSyncTimestamp() {
  File f = LittleFS.open(FILE_SYNC, "r");
  if (!f) return 0;

  char lineBuf[LINE_BUF_SIZE];
  int len = 0;
  while (f.available() && len < LINE_BUF_SIZE - 1) {
    char c = f.read();
    if (c == '\n' || c == '\r') break;
    lineBuf[len++] = c;
  }
  lineBuf[len] = '\0';
  f.close();

  if (len == 0) return 0;
  return (uint32_t)strtoul(lineBuf, NULL, 10);
}

// ─────────────────────────────────────────
//  8. writeSyncTimestamp(ts)
//  Overwrites sync.dat with a new timestamp.
// ─────────────────────────────────────────
bool writeSyncTimestamp(uint32_t ts) {
  File f = LittleFS.open(FILE_SYNC, "w");
  if (!f) {
    Serial.println("[FS]  ERROR: cannot write sync.dat");
    return false;
  }
  char buf[16];
  snprintf(buf, sizeof(buf), "%lu", (unsigned long)ts);
  f.println(buf);
  f.close();
  return true;
}

// ─────────────────────────────────────────
//  9. readSessionState(status, uid)
//  Reads sess.dat into two output buffers.
//  Format: [STATUS],[ACTIVE_UID]
// ─────────────────────────────────────────
void readSessionState(int* status, char* uid, int uidBufSize) {
  *status = 0;
  strncpy(uid, "NONE", uidBufSize);

  File f = LittleFS.open(FILE_SESSION, "r");
  if (!f) return;

  char lineBuf[LINE_BUF_SIZE];
  int len = 0;
  while (f.available() && len < LINE_BUF_SIZE - 1) {
    char c = f.read();
    if (c == '\n' || c == '\r') break;
    lineBuf[len++] = c;
  }
  lineBuf[len] = '\0';
  f.close();

  // Parse "STATUS,UID"
  char* comma = strchr(lineBuf, ',');
  if (!comma) return;

  *comma = '\0';
  *status = atoi(lineBuf);
  strncpy(uid, comma + 1, uidBufSize - 1);
  uid[uidBufSize - 1] = '\0';
}

// ─────────────────────────────────────────
//  10. writeSessionState(status, uid)
//  Overwrites sess.dat.
//  Called on login, logout, WDT recovery.
// ─────────────────────────────────────────
bool writeSessionState(int status, const char* uid) {
  File f = LittleFS.open(FILE_SESSION, "w");
  if (!f) {
    Serial.println("[FS]  ERROR: cannot write sess.dat");
    return false;
  }
  char buf[LINE_BUF_SIZE];
  snprintf(buf, sizeof(buf), "%d,%s", status, uid);
  f.println(buf);
  f.close();
  return true;
}

// ─────────────────────────────────────────
//  SELF-TEST  (runs once on boot)
//  Verifies every helper works correctly
//  before the state machine takes over.
// ─────────────────────────────────────────
void runFileSystemTest() {
  Serial.println("\n[FS]  ── Phase 2 Self-Test ──");

  // --- seed test data ---
  // Whitelist: add two UIDs
  appendLineToFile(FILE_WHITELIST, "A1B2C3D4");
  appendLineToFile(FILE_WHITELIST, "E5F6G7H8");

  // Blacklist: add one UID
  appendLineToFile(FILE_BLACKLIST, "DEADBEEF");

  // drv.dat: one driver
  appendLineToFile(FILE_DRIVERS, "A1B2C3D4,1234");

  // adm.dat: one admin
  appendLineToFile(FILE_ADMINS, "E5F6G7H8,9999");

  // tx.log: two entries for A1B2C3D4, one for E5F6G7H8
  appendLineToFile(FILE_TX_LOG, "A1B2C3D4,-200,1708000500,D9E8F7G6");
  appendLineToFile(FILE_TX_LOG, "A1B2C3D4,-200,1708000600,D9E8F7G6");
  appendLineToFile(FILE_TX_LOG, "E5F6G7H8,-200,1708000700,D9E8F7G6");

  // sync.dat
  writeSyncTimestamp(1708000500);

  // sess.dat
  writeSessionState(1, "A1B2C3D4");

  Serial.println("[FS]  Test data seeded.\n");

  // --- run assertions ---
  Serial.println("[FS]  Running assertions...");

  // isUIDInFile
  Serial.printf("  isUIDInFile(wl, A1B2C3D4)  → %s  [expect: true]\n",
    isUIDInFile(FILE_WHITELIST, "A1B2C3D4") ? "TRUE" : "FALSE");
  Serial.printf("  isUIDInFile(wl, 00000000)   → %s  [expect: false]\n",
    isUIDInFile(FILE_WHITELIST, "00000000") ? "TRUE" : "FALSE");
  Serial.printf("  isUIDInFile(bl, DEADBEEF)   → %s  [expect: true]\n",
    isUIDInFile(FILE_BLACKLIST, "DEADBEEF") ? "TRUE" : "FALSE");

  // countLinesInFile
  Serial.printf("  countLines(tx.log)          → %d    [expect: 3]\n",
    countLinesInFile(FILE_TX_LOG));

  // countUIDInTxLog
  Serial.printf("  countUID(A1B2C3D4)          → %d    [expect: 2]\n",
    countUIDInTxLog("A1B2C3D4"));
  Serial.printf("  countUID(E5F6G7H8)          → %d    [expect: 1]\n",
    countUIDInTxLog("E5F6G7H8"));

  // readSyncTimestamp
  Serial.printf("  readSyncTimestamp()         → %lu  [expect: 1708000500]\n",
    (unsigned long)readSyncTimestamp());

  // readSessionState
  int sessStatus; char sessUID[16];
  readSessionState(&sessStatus, sessUID, sizeof(sessUID));
  Serial.printf("  readSession status          → %d    [expect: 1]\n", sessStatus);
  Serial.printf("  readSession uid             → %s  [expect: A1B2C3D4]\n", sessUID);

  // removeUIDFromFile
  removeUIDFromFile(FILE_WHITELIST, "A1B2C3D4");
  Serial.printf("  after remove, wl has A1B2C3D4 → %s  [expect: false]\n",
    isUIDInFile(FILE_WHITELIST, "A1B2C3D4") ? "TRUE" : "FALSE");
  Serial.printf("  after remove, wl has E5F6G7H8 → %s  [expect: true]\n",
    isUIDInFile(FILE_WHITELIST, "E5F6G7H8") ? "TRUE" : "FALSE");

  Serial.println("\n[FS]  ── Self-Test Complete ──\n");
}

// ─────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=============================");
  Serial.println("  C-TRANSIT TERMINAL BOOT");
  Serial.println("  Phase 2 — File System");
  Serial.println("=============================\n");

  if (!LittleFS.begin(true)) {
    Serial.println("[FS]  FATAL: LittleFS mount failed");
    while (true) delay(1000);
  }
  Serial.printf("[FS]  Mounted OK (total: %d B, used: %d B)\n\n",
    LittleFS.totalBytes(), LittleFS.usedBytes());

  createFilesIfMissing();
  runFileSystemTest();
}

void loop() {
  delay(1000);
}