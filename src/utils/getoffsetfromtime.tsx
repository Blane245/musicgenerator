export default function getOffsetFromTime(
  time: number,
  width: number,
  startTime: number,
  endTime: number
) {
  return ((time - startTime) * width) / (endTime - startTime);
}
