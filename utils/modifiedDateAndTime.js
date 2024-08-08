const { utcToZonedTime, zonedTimeToUtc, format } = require("date-fns-tz");

function getModifiedDateAndTime(
  dateToModify,
  timezone,
  twentyFourFormat = false,
  formatStr = undefined
) {
  // Set the date to "2018-09-01T16:01:36.386Z"
  const utcDate = zonedTimeToUtc(dateToModify, timezone);

  // Obtain a Date instance that will render the equivalent Berlin time for the UTC date
  const date = new Date(dateToModify);
  const timeZone = timezone;
  const zonedDate = utcToZonedTime(date, timeZone);
  // zonedDate could be used to initialize a date picker or display the formatted local date/time

  // Set the output to "1.9.2018 18:01:36.386 GMT+02:00 (CEST)"
  const pattern = twentyFourFormat
    ? "PP HH:mm:ss 'GMT' XXX (z)"
    : "PPpp 'GMT' XXX (z)";

  const output = format(zonedDate, formatStr ? formatStr : pattern, {
    timeZone: timeZone,
  });

  return output;
}

function getModifiedDateAndTimeWithoutFormat(dateToModify, timezone) {
  // Set the date to "2018-09-01T16:01:36.386Z"
  const utcDate = zonedTimeToUtc(dateToModify, timezone);

  // Obtain a Date instance that will render the equivalent Berlin time for the UTC date
  const date = new Date(utcDate);
  const timeZone = timezone;
  const zonedDate = utcToZonedTime(utcDate, timeZone);
  // zonedDate could be used to initialize a date picker or display the formatted local date/time

  // Set the output to "1.9.2018 18:01:36.386 GMT+02:00 (CEST)"
  // const pattern = twentyFourFormat
  //   ? "PP HH:mm:ss 'GMT' XXX (z)"
  //   : "PPpp 'GMT' XXX (z)";
  // const output = format(zonedDate, "PP HH:mm:ss", { timeZone: timeZone });
  return zonedDate;
}

function getUTCDate(dateToModify, timezone) {
  const utcDate = zonedTimeToUtc(dateToModify, timezone);
  return utcDate;
  // return format(utcToZonedTime(utcDate, timezone), "PP HH:mm:ss", {
  //   timeZone: timezone,
  // });
}

module.exports = {
  getModifiedDateAndTime,
  getModifiedDateAndTimeWithoutFormat,
  getUTCDate,
};
