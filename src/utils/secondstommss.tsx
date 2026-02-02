  export default function secondsToMMSS (time: number | undefined): string {
    if (time == undefined) return "";
    const seconds: number = time % 60;
    const minutes: number = Math.trunc(time / 60);
    return (
      minutes.toFixed(0).padStart(2, "0") +
      ":" +
      seconds.toFixed(0).padStart(2, "0")
    );
  };
