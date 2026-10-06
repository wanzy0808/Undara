export function seatingCanvasColors(dark = false) {
  return {
    background: dark ? "#703B3B" : "#EDE3D8", table: dark ? "#D6B38C" : "#703B3B",
    tableText: dark ? "#321B1B" : "#FFF9F3", seatEmpty: dark ? "#542C2C" : "#FFF9F3",
    seatOccupied: "#D6B38C", seatStroke: dark ? "#D6B38C" : "#703B3B",
    guestText: dark ? "#FFF9F3" : "#321B1B", mutedText: dark ? "#EDE3D8" : "#703B3B",
  };
}
