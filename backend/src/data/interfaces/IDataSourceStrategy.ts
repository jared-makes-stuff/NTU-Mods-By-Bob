/**
 * Data Source Strategy Interface
 * 
 * This interface defines the contract for data ingestion strategies.
 * Different implementations can fetch data from various sources:
 * - External university API
 * - CSV file uploads
 * - Manual database entries
 * - Web scraping
 * 
 * Strategy Pattern Benefits:
 * - Easy to add new data sources without modifying existing code
 * - Testable: Mock strategies for unit tests
 * - Flexible: Switch data sources via configuration
 * - Maintainable: Each strategy is self-contained
 */

import { SyncResult } from '../../types/domain';

/**
 * Interface for data source strategies
 * All data ingestion implementations must implement this interface
 */
export interface IDataSourceStrategy {
  /**
   * Fetch and sync module data from the data source
   * 
   * This method should:
   * 1. Fetch data from the source (API, file, etc.)
   * 2. Normalize/transform data to match our schema
   * 3. Validate data integrity
   * 4. Update database (create, update, or delete records)
   * 5. Return sync results with statistics
   * 
   * @returns Promise<SyncResult> - Statistics about the sync operation
   * @throws Error if sync fails
   */
  syncModules(): Promise<SyncResult>;

  /**
   * Get the name of this data source strategy
   * Used for logging and debugging
   * 
   * @returns string - Strategy name (e.g., "ExternalAPI", "CSVUpload")
   */
  getName(): string;

  /**
   * Test connection to the data source
   * Used for health checks and validation
   * 
   * @returns Promise<boolean> - True if connection is successful
   */
  testConnection(): Promise<boolean>;
}
