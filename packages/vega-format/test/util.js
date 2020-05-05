module.exports = {
  local: function(y, m, d, H, M, S, L) {
    return new Date(y, m||0, d||1, H||0, M||0, S||0, L||0);
  },
  utc: function(y, m, d, H, M, S, L) {
    return new Date(Date.UTC(y, m||0, d||1, H||0, M||0, S||0, L||0));
  },
  enUS: {
    number: {
      decimal: '.',
      thousands: ',',
      grouping: [3],
      currency: ['$', '']
    },
    time: {
      dateTime: '%x, %X',
      date: '%-m/%-d/%Y',
      time: '%-I:%M:%S %p',
      periods: ['AM', 'PM'],
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    }
  },
  deDE: {
    number: {
      decimal: ',',
      thousands: '.',
      grouping: [3],
      currency: ['', '\u00a0€']
    },
    time: {
      dateTime: '%A, der %e. %B %Y, %X',
      date: '%d.%m.%Y',
      time: '%H:%M:%S',
      periods: ['AM', 'PM'],
      days: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
      shortDays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
      months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
      shortMonths: ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
    }
  }
};
