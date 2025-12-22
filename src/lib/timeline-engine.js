export class TimelineEngine {
  static MONTHS_IN_YEAR = 12;
  static DAYS_IN_LEAP_YEAR = 366;
  static DAYS_IN_REGULAR_YEAR = 365;

  static isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  static getDaysInMonth(year, month) {
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 2 && this.isLeapYear(year)) {
      return 29;
    }
    return monthDays[month - 1];
  }

  static calculateNextPeriod(year, month, interval) {
    let nextYear = year;
    let nextMonth = month + (interval || 12);

    while (nextMonth > this.MONTHS_IN_YEAR) {
      nextMonth -= this.MONTHS_IN_YEAR;
      nextYear += 1;
    }

    return { year: nextYear, month: nextMonth };
  }

  static calculateDeadline(year, month, daysUntil = 0) {
    const startDate = new Date(year, month - 1, 1);
    const deadline = new Date(startDate);
    deadline.setDate(deadline.getDate() + daysUntil);
    return deadline;
  }

  static getDaysUntilDeadline(timestamp) {
    if (!timestamp) return null;
    const now = Date.now();
    const deadlineTime = typeof timestamp === 'number' ? timestamp * 1000 : new Date(timestamp).getTime();
    const diffMs = deadlineTime - now;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  static getDeadlineRange(daysUntil) {
    if (daysUntil === null || daysUntil === undefined) return 'unknown';
    if (daysUntil < 0) return 'overdue';
    if (daysUntil === 0) return 'today';
    if (daysUntil <= 7) return 'this_week';
    if (daysUntil <= 30) return 'this_month';
    return 'future';
  }

  static calculatePeriodDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  static validateDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start < end;
  }

  static formatPeriod(year, month) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${monthNames[month - 1]} ${year}`;
  }
}

export const timelineEngine = new TimelineEngine();

export default timelineEngine;
