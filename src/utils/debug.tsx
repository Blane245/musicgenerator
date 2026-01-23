// Debug utility for conditional logging
enum DEBUGLEVEL {
  info= 'info',
  warn = 'warn',
  error = 'error',
  all = 'all',
  none = 'none',
}
let debugLevel:DEBUGLEVEL = DEBUGLEVEL.none;

export const setDebugMode = (level: string) => {
  debugLevel = DEBUGLEVEL[level];
};

export const debug = {
  log: (...args: any[]) => {
    if (debugLevel != DEBUGLEVEL.none) console.log(...args);
  },
  warn: (...args: any[]) => {
    if (debugLevel == DEBUGLEVEL.warn || debugLevel == DEBUGLEVEL.all) console.warn(...args);
  },
  error: (...args: any[]) => {
    if (debugLevel == DEBUGLEVEL.error || debugLevel == DEBUGLEVEL.all) console.error(...args);
  },
  info: (...args: any[]) => {
    if (debugLevel == DEBUGLEVEL.info || debugLevel == DEBUGLEVEL.all) console.info(...args);
  },
  table: (data: any) => {
    if (debugLevel != DEBUGLEVEL.none) console.table(data);
  },
};
