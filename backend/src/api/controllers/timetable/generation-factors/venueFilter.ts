import { ClassItem, GenerationFilters } from '../generation/types';

function isOnlineVenue(venue: string): boolean {
  const onlineKeywords = ['online', 'e-learn', 'elearn', 'virtual', 'zoom', 'teams'];
  return onlineKeywords.some(keyword => venue.toLowerCase().includes(keyword));
}

/**
 * Enforce venue preferences (online vs in-person).
 */
export function passesVenuePreference(
  classes: ClassItem[],
  filters: GenerationFilters
): boolean {
  const venueFilterActive =
    !filters.venuePreference.includeOnline || !filters.venuePreference.includeInPerson;

  if (!venueFilterActive) {
    return true;
  }

  const hasOnlineClass = classes.some(c => isOnlineVenue(c.venue));
  const hasInPersonClass = classes.some(c => !isOnlineVenue(c.venue));

  if (filters.venuePreference.includeOnline && !filters.venuePreference.includeInPerson && hasInPersonClass) {
    return false;
  }

  if (!filters.venuePreference.includeOnline && filters.venuePreference.includeInPerson && hasOnlineClass) {
    return false;
  }

  return true;
}
