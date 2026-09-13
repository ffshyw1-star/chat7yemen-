export interface DiagnosticLogEntry {
  id: string;
  timestamp: string;
  timeDisplay: string;
  source: string;
  documentPath?: string;
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
  writeResult?: string;
  fromCache?: boolean;
  hasPendingWrites?: boolean;
  totalDocs?: number;
  docChangesCount?: number;
  docIds?: string[];
  error?: string;
  details?: any;
}

type LogSubscriber = (logs: DiagnosticLogEntry[]) => void;

class DiagnosticManager {
  private logs: DiagnosticLogEntry[] = [];
  private subscribers: Set<LogSubscriber> = new Set();
  private maxLogs = 200;

  addLog(entry: Omit<DiagnosticLogEntry, 'id' | 'timestamp' | 'timeDisplay'>): DiagnosticLogEntry {
    const now = new Date();
    const timeDisplay = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });

    const fullEntry: DiagnosticLogEntry = {
      id: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toISOString(),
      timeDisplay,
      ...entry
    };

    this.logs = [fullEntry, ...this.logs].slice(0, this.maxLogs);

    // Browser DevTools output with clear formatting
    const isError = entry.writeResult?.includes('ERROR') || !!entry.error;
    const style = isError
      ? 'background: #fee2e2; color: #b91c1c; font-weight: bold; padding: 2px 6px; border-radius: 4px;'
      : 'background: #dbeafe; color: #1d4ed8; font-weight: bold; padding: 2px 6px; border-radius: 4px;';

    console.log(
      `%c[Firestore Sync Diagnostic: ${entry.source}]%c ${entry.documentPath || ''} ${entry.writeResult || ''}`,
      style,
      'color: inherit;',
      {
        documentPath: entry.documentPath,
        fieldName: entry.fieldName,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
        writeResult: entry.writeResult,
        fromCache: entry.fromCache,
        hasPendingWrites: entry.hasPendingWrites,
        docIds: entry.docIds,
        docChangesCount: entry.docChangesCount,
        error: entry.error
      }
    );

    this.notify();
    return fullEntry;
  }

  getLogs(): DiagnosticLogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    this.notify();
  }

  subscribe(subscriber: LogSubscriber): () => void {
    this.subscribers.add(subscriber);
    subscriber([...this.logs]);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  private notify(): void {
    const snapshot = [...this.logs];
    this.subscribers.forEach((sub) => {
      try {
        sub(snapshot);
      } catch (err) {
        console.error('Subscriber error in DiagnosticManager:', err);
      }
    });
  }
}

export const syncDiagnostics = new DiagnosticManager();

export const logSyncDiagnostic = (
  entry: Omit<DiagnosticLogEntry, 'id' | 'timestamp' | 'timeDisplay'>
): DiagnosticLogEntry => {
  return syncDiagnostics.addLog(entry);
};
