/**
 * Data Source Factory
 * 
 * Factory pattern implementation for creating data source strategies.
 * This factory determines which data ingestion strategy to use based on
 * configuration or runtime conditions.
 * 
 * Benefits:
 * - Centralized strategy instantiation
 * - Easy to add new strategies
 * - Configuration-based strategy selection
 * - Testable: Can inject mock strategies
 */

import { IDataSourceStrategy } from '../interfaces/IDataSourceStrategy';
import { ExternalApiStrategy } from '../strategy/external-api/ExternalApiStrategy';
import { logger } from '../../config/logger';

/**
 * Available data source types
 */
export enum DataSourceType {
  EXTERNAL_API = 'external_api',
}

/**
 * Data Source Factory
 * Creates and returns the appropriate data source strategy
 */
export class DataSourceFactory {
  /**
   * Create a data source strategy based on type
   * 
   * @param type - Type of data source to create
   * @returns IDataSourceStrategy implementation
   * @throws Error if type is not supported
   */
  static createStrategy(type: DataSourceType = DataSourceType.EXTERNAL_API): IDataSourceStrategy {
    if (type !== DataSourceType.EXTERNAL_API) {
      throw new Error(`Unknown data source type: ${type}`);
    }
    return new ExternalApiStrategy();
  }

  /**
   * Get the default data source strategy
   * Currently defaults to External API
   * 
   * @returns IDataSourceStrategy - Default strategy instance
   */
  static getDefaultStrategy(): IDataSourceStrategy {
    // Could be made configurable via environment variable
    // const strategyType = env.DATA_SOURCE_TYPE || DataSourceType.EXTERNAL_API;
    return this.createStrategy(DataSourceType.EXTERNAL_API);
  }

  /**
   * Get all available strategy types
   * Useful for UI selection or documentation
   * 
   * @returns Array of available strategy types
   */
  static getAvailableTypes(): DataSourceType[] {
    return [
      DataSourceType.EXTERNAL_API,
    ];
  }

  /**
   * Test if a strategy is available and working
   * 
   * @param type - Strategy type to test
   * @returns Promise<boolean> - True if strategy works
   */
  static async testStrategy(type: DataSourceType): Promise<boolean> {
    try {
      const strategy = this.createStrategy(type);
      return await strategy.testConnection();
    } catch (error) {
      logger.error(`Failed to test strategy ${type}:`, error);
      return false;
    }
  }
}



