import * as cheerio from 'cheerio';
import { IndexVacancy } from './types';
import { logger } from '../../../config/logger';

function parseNumber(text: string): number {
  const cleaned = text.trim();
  if (!cleaned || cleaned === '&nbsp;' || cleaned === '-' || cleaned === 'N/A') {
    return 0;
  }
  return parseInt(cleaned, 10) || 0;
}

export function parseVacancyHtml(html: string, courseCode: string): IndexVacancy[] | null {
  try {
    const $ = cheerio.load(html);
    const table = $('table[border]').first();
    if (!table.length) {
      logger.warn(`No vacancy table found for course ${courseCode}`);
      return [];
    }

    const indexes: IndexVacancy[] = [];
    let currentIndex: IndexVacancy | null = null;

    const rows = table.find('tr').slice(1);
    rows.each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 8) {
        return;
      }

      const indexNum = $(cells[0]).text().trim();
      const vacancyText = $(cells[1]).text().trim();
      const waitlistText = $(cells[2]).text().trim();
      const classType = $(cells[3]).text().trim();
      const group = $(cells[4]).text().trim();
      const day = $(cells[5]).text().trim();
      const time = $(cells[6]).text().trim();
      const venue = $(cells[7]).text().trim();
      const remark = cells.length > 8 ? $(cells[8]).text().trim() : undefined;

      if (indexNum && indexNum !== '&nbsp;') {
        currentIndex = {
          index: indexNum,
          vacancy: parseNumber(vacancyText),
          waitlist: parseNumber(waitlistText),
          classes: [],
        };
        indexes.push(currentIndex);
      }

      if (currentIndex && classType) {
        currentIndex.classes.push({
          type: classType,
          group,
          day,
          time,
          venue,
          ...(remark && remark !== '' && { remark }),
        });
      }
    });

    return indexes;
  } catch (error) {
    logger.error(`Error parsing HTML for ${courseCode}:`, error);
    return null;
  }
}



