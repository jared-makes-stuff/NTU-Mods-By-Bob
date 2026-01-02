import { env } from '../../../config/env';

export function isServiceAvailable(): { available: boolean; message: string } {
  const now = new Date();
  const singaporeTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
  const currentHour = singaporeTime.getHours();

  const startHour = env.VACANCY_SERVICE_START_HOUR;
  const endHour = env.VACANCY_SERVICE_END_HOUR;

  if (currentHour >= startHour && currentHour < endHour) {
    return { available: true, message: 'Service available' };
  }

  const timeStr = singaporeTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return {
    available: false,
    message: `NTU vacancy service is only available from ${startHour}:00 to ${endHour}:00 (Singapore time). Current time: ${timeStr}`,
  };
}
