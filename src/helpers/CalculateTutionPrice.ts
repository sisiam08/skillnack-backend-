
export const calculateTutionPrice = (
  duration: number,
  tutorHourlyRate: number,
) => {
  const durationHours = duration / 60;
  const totalPrice = Number((durationHours * tutorHourlyRate).toFixed(2));

  return totalPrice;
};
