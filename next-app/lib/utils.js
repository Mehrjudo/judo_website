export function formatDate(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  const months = ['Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  return `${parseInt(day, 10)}. ${months[parseInt(month, 10) - 1]} ${year}`;
}
