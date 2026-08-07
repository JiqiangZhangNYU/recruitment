(function (global) {
  "use strict";

  var DB_NAME = "recruitment-interview-recordings";
  var DB_VERSION = 1;
  var STORE_NAME = "recordings";
  var MAX_PER_QUESTION = 3;
  var MAX_RECORDINGS = 30;
  var MAX_BYTES = 100 * 1024 * 1024;
  var databasePromise = null;

  function RecordingStoreError(code, message, cause) {
    this.name = "InterviewRecordingStoreError";
    this.code = code;
    this.message = message;
    if (cause) this.cause = cause;
    if (Error.captureStackTrace) Error.captureStackTrace(this, RecordingStoreError);
  }

  RecordingStoreError.prototype = Object.create(Error.prototype);
  RecordingStoreError.prototype.constructor = RecordingStoreError;

  function normalizeError(error, fallbackCode, context) {
    if (error instanceof RecordingStoreError) return error;

    var code = fallbackCode;
    if (error && error.name === "QuotaExceededError") code = "QUOTA_EXCEEDED";
    if (error && error.name === "AbortError") code = "TRANSACTION_ABORTED";
    if (error && error.name === "SecurityError") code = "UNAVAILABLE";
    if (error && error.name === "InvalidStateError" && fallbackCode === "OPEN_FAILED") {
      code = "UNAVAILABLE";
    }

    var detail = error && error.message ? ": " + error.message : "";
    return new RecordingStoreError(code, context + detail, error);
  }

  function isSupported() {
    return Boolean(global.indexedDB && typeof global.indexedDB.open === "function");
  }

  function createSchema(request) {
    var database = request.result;
    var store;

    if (!database.objectStoreNames.contains(STORE_NAME)) {
      store = database.createObjectStore(STORE_NAME, {
        keyPath: "id",
        autoIncrement: true,
      });
    } else {
      store = request.transaction.objectStore(STORE_NAME);
    }

    if (!store.indexNames.contains("questionId")) {
      store.createIndex("questionId", "questionId", { unique: false });
    }
    if (!store.indexNames.contains("createdAtMs")) {
      store.createIndex("createdAtMs", "createdAtMs", { unique: false });
    }
  }

  function openDatabase() {
    if (!isSupported()) {
      return Promise.reject(new RecordingStoreError(
        "UNAVAILABLE",
        "IndexedDB is not available in this browser.",
      ));
    }
    if (databasePromise) return databasePromise;

    var attempt = new Promise(function (resolve, reject) {
      var request;
      var settled = false;
      var upgradeError = null;

      function rejectOnce(error) {
        if (settled) return;
        settled = true;
        reject(error);
      }

      try {
        request = global.indexedDB.open(DB_NAME, DB_VERSION);
      } catch (error) {
        rejectOnce(normalizeError(error, "OPEN_FAILED", "Unable to open the recording database"));
        return;
      }

      request.addEventListener("upgradeneeded", function () {
        try {
          createSchema(request);
        } catch (error) {
          upgradeError = normalizeError(error, "OPEN_FAILED", "Unable to create the recording database");
          try {
            request.transaction.abort();
          } catch (abortError) {
            rejectOnce(upgradeError);
          }
        }
      });

      request.addEventListener("blocked", function () {
        rejectOnce(new RecordingStoreError(
          "OPEN_BLOCKED",
          "The recording database is blocked by another open page. Close other tabs and retry.",
        ));
      });

      request.addEventListener("error", function () {
        rejectOnce(upgradeError || normalizeError(
          request.error,
          "OPEN_FAILED",
          "Unable to open the recording database",
        ));
      });

      request.addEventListener("success", function () {
        var database = request.result;
        if (settled) {
          database.close();
          return;
        }

        settled = true;
        database.addEventListener("versionchange", function () {
          database.close();
          if (databasePromise === attempt) databasePromise = null;
        });
        database.addEventListener("close", function () {
          if (databasePromise === attempt) databasePromise = null;
        });
        resolve(database);
      });
    });

    databasePromise = attempt;
    attempt.catch(function () {
      if (databasePromise === attempt) databasePromise = null;
    });
    return attempt;
  }

  function runTransaction(mode, context, operation) {
    return openDatabase().then(function (database) {
      return new Promise(function (resolve, reject) {
        var transaction;
        var store;
        var result;
        var operationError = null;
        var settled = false;

        function rejectOnce(error) {
          if (settled) return;
          settled = true;
          reject(normalizeError(error, "TRANSACTION_ERROR", context));
        }

        function watch(request) {
          request.addEventListener("error", function () {
            if (!operationError) {
              operationError = normalizeError(request.error, "TRANSACTION_ERROR", context);
            }
          });
          return request;
        }

        function fail(error) {
          operationError = normalizeError(error, "TRANSACTION_ERROR", context);
          try {
            transaction.abort();
          } catch (abortError) {
            rejectOnce(operationError);
          }
        }

        try {
          transaction = database.transaction(STORE_NAME, mode);
          store = transaction.objectStore(STORE_NAME);
        } catch (error) {
          rejectOnce(error);
          return;
        }

        transaction.addEventListener("complete", function () {
          if (settled) return;
          settled = true;
          resolve(result);
        });
        transaction.addEventListener("error", function () {
          if (!operationError) {
            operationError = normalizeError(transaction.error, "TRANSACTION_ERROR", context);
          }
        });
        transaction.addEventListener("abort", function () {
          rejectOnce(operationError || transaction.error || new Error("Transaction aborted"));
        });

        try {
          operation(store, function (value) {
            result = value;
          }, watch, fail);
        } catch (error) {
          fail(error);
        }
      });
    });
  }

  function requireQuestionId(questionId) {
    if (typeof questionId !== "string" || !questionId.trim()) {
      throw new RecordingStoreError("INVALID_ARGUMENT", "questionId must be a non-empty string.");
    }
    return questionId.trim();
  }

  function requireRecordingId(id) {
    var normalized = Number(id);
    if (!Number.isSafeInteger(normalized) || normalized < 1) {
      throw new RecordingStoreError("INVALID_ARGUMENT", "id must be a positive integer.");
    }
    return normalized;
  }

  function isBlobLike(blob) {
    return Boolean(
      blob
      && Number.isFinite(blob.size)
      && blob.size >= 0
      && typeof blob.type === "string"
      && typeof blob.slice === "function"
    );
  }

  function compareOldestFirst(left, right) {
    var leftId = Number(left.id);
    var rightId = Number(right.id);
    if (Number.isFinite(leftId) && Number.isFinite(rightId) && leftId !== rightId) {
      return leftId - rightId;
    }

    var leftTime = Number(left.createdAtMs) || Date.parse(left.createdAt) || 0;
    var rightTime = Number(right.createdAtMs) || Date.parse(right.createdAt) || 0;
    if (leftTime !== rightTime) return leftTime - rightTime;
    return 0;
  }

  function formatSize(bytes) {
    var units = ["B", "KB", "MB", "GB"];
    var value = Math.max(0, Number(bytes) || 0);
    var unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }

    var digits = unitIndex === 0 || value >= 10 ? 0 : 1;
    return value.toFixed(digits) + " " + units[unitIndex];
  }

  function formatDuration(seconds) {
    var total = Math.max(0, Math.round(Number(seconds) || 0));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var remainingSeconds = total % 60;
    var minuteText = hours ? String(minutes).padStart(2, "0") : String(minutes);
    var secondText = String(remainingSeconds).padStart(2, "0");

    return hours
      ? hours + ":" + minuteText + ":" + secondText
      : minuteText + ":" + secondText;
  }

  function formatCreatedAt(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value || "");

    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    } catch (error) {
      return date.toLocaleString();
    }
  }

  function presentRecord(record) {
    return {
      id: record.id,
      questionId: record.questionId,
      blob: record.blob,
      mimeType: record.mimeType,
      createdAt: record.createdAt,
      createdAtMs: record.createdAtMs,
      createdAtLabel: formatCreatedAt(record.createdAt),
      size: Number(record.size) || 0,
      sizeLabel: formatSize(record.size),
      duration: Number(record.duration) || 0,
      durationLabel: formatDuration(record.duration),
    };
  }

  function planEvictions(records) {
    var ordered = records.slice().sort(compareOldestFirst);
    var evictedIds = new Set();
    var perQuestion = Object.create(null);

    // Enforce the per-question limit before the global count and byte limits.
    ordered.forEach(function (record) {
      if (!perQuestion[record.questionId]) perQuestion[record.questionId] = [];
      perQuestion[record.questionId].push(record);
    });

    Object.keys(perQuestion).forEach(function (questionId) {
      var questionRecords = perQuestion[questionId];
      while (questionRecords.length > MAX_PER_QUESTION) {
        evictedIds.add(questionRecords.shift().id);
      }
    });

    var remaining = ordered.filter(function (record) {
      return !evictedIds.has(record.id);
    });
    while (remaining.length > MAX_RECORDINGS) {
      evictedIds.add(remaining.shift().id);
    }

    var totalSize = remaining.reduce(function (total, record) {
      return total + (Number(record.size) || 0);
    }, 0);
    while (totalSize > MAX_BYTES && remaining.length) {
      var oldest = remaining.shift();
      evictedIds.add(oldest.id);
      totalSize -= Number(oldest.size) || 0;
    }

    return Array.from(evictedIds);
  }

  function open() {
    return openDatabase().then(function () {
      return api;
    });
  }

  function list(questionId) {
    var normalizedQuestionId;
    try {
      normalizedQuestionId = questionId === undefined ? null : requireQuestionId(questionId);
    } catch (error) {
      return Promise.reject(error);
    }

    return runTransaction("readonly", "Unable to list recordings", function (store, setResult, watch) {
      var request = normalizedQuestionId === null
        ? store.getAll()
        : store.index("questionId").getAll(normalizedQuestionId);
      watch(request).addEventListener("success", function () {
        var records = request.result.slice().sort(compareOldestFirst).reverse();
        setResult(records.map(presentRecord));
      });
    });
  }

  function save(input) {
    var questionId;
    var blob;
    var duration;
    var mimeType;

    try {
      if (!input || typeof input !== "object") {
        throw new RecordingStoreError("INVALID_ARGUMENT", "save requires a recording object.");
      }
      questionId = requireQuestionId(input.questionId);
      blob = input.blob;
      if (!isBlobLike(blob) || blob.size === 0) {
        throw new RecordingStoreError("INVALID_ARGUMENT", "blob must be a non-empty Blob.");
      }
      if (blob.size > MAX_BYTES) {
        throw new RecordingStoreError("LIMIT_EXCEEDED", "The recording exceeds the 100 MB storage limit.");
      }
      duration = Number(input.duration);
      if (!Number.isFinite(duration) || duration < 0) {
        throw new RecordingStoreError("INVALID_ARGUMENT", "duration must be a non-negative number of seconds.");
      }
      mimeType = typeof input.mimeType === "string" && input.mimeType.trim()
        ? input.mimeType.trim()
        : blob.type || "application/octet-stream";
    } catch (error) {
      return Promise.reject(error);
    }

    return runTransaction("readwrite", "Unable to save the recording", function (store, setResult, watch, fail) {
      var allRequest = watch(store.getAll());
      allRequest.addEventListener("success", function () {
        var createdAtMs = Date.now();
        var storedRecord = {
          questionId: questionId,
          blob: blob,
          mimeType: mimeType,
          size: blob.size,
          duration: duration,
          createdAt: new Date(createdAtMs).toISOString(),
          createdAtMs: createdAtMs,
        };
        var addRequest;

        try {
          addRequest = watch(store.add(storedRecord));
        } catch (error) {
          fail(error);
          return;
        }

        addRequest.addEventListener("success", function () {
          storedRecord.id = addRequest.result;
          var evictedIds = planEvictions(allRequest.result.concat(storedRecord));

          try {
            evictedIds.forEach(function (id) {
              watch(store.delete(id));
            });
          } catch (error) {
            fail(error);
            return;
          }

          var saved = presentRecord(storedRecord);
          saved.evictedIds = evictedIds;
          saved.evictedCount = evictedIds.length;
          setResult(saved);
        });
      });
    });
  }

  function remove(id) {
    var normalizedId;
    try {
      normalizedId = requireRecordingId(id);
    } catch (error) {
      return Promise.reject(error);
    }

    return runTransaction("readwrite", "Unable to remove the recording", function (store, setResult, watch, fail) {
      var getRequest = watch(store.get(normalizedId));
      getRequest.addEventListener("success", function () {
        if (!getRequest.result) {
          setResult(false);
          return;
        }

        try {
          watch(store.delete(normalizedId));
          setResult(true);
        } catch (error) {
          fail(error);
        }
      });
    });
  }

  function clear() {
    return runTransaction("readwrite", "Unable to clear recordings", function (store, setResult, watch, fail) {
      var countRequest = watch(store.count());
      countRequest.addEventListener("success", function () {
        try {
          watch(store.clear());
          setResult(countRequest.result);
        } catch (error) {
          fail(error);
        }
      });
    });
  }

  function stats() {
    return runTransaction("readonly", "Unable to read recording statistics", function (store, setResult, watch) {
      var request = watch(store.getAll());
      request.addEventListener("success", function () {
        var totalSize = request.result.reduce(function (total, record) {
          return total + (Number(record.size) || 0);
        }, 0);
        var counts = Object.create(null);

        request.result.forEach(function (record) {
          counts[record.questionId] = (counts[record.questionId] || 0) + 1;
        });

        setResult({
          count: request.result.length,
          maxCount: MAX_RECORDINGS,
          remainingCount: Math.max(0, MAX_RECORDINGS - request.result.length),
          totalSize: totalSize,
          totalSizeLabel: formatSize(totalSize),
          maxSize: MAX_BYTES,
          maxSizeLabel: formatSize(MAX_BYTES),
          remainingSize: Math.max(0, MAX_BYTES - totalSize),
          remainingSizeLabel: formatSize(Math.max(0, MAX_BYTES - totalSize)),
          maxPerQuestion: MAX_PER_QUESTION,
          questionCounts: counts,
        });
      });
    });
  }

  var api = Object.freeze({
    open: open,
    list: list,
    save: save,
    remove: remove,
    clear: clear,
    stats: stats,
    isSupported: isSupported,
    Error: RecordingStoreError,
    limits: Object.freeze({
      perQuestion: MAX_PER_QUESTION,
      recordings: MAX_RECORDINGS,
      bytes: MAX_BYTES,
    }),
  });

  global.InterviewRecordingStore = api;
}(window));
