#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import chalk from 'chalk';
import { logger } from '../src/config/logger';

interface TestSuite {
  name: string;
  command: string;
  description: string;
}

const testSuites: TestSuite[] = [
  {
    name: 'Authentication',
    command: 'npm run test:auth',
    description: 'User authentication, registration, login, and JWT handling'
  },
  {
    name: 'User Management',
    command: 'npm run test:user',
    description: 'User CRUD operations, profile management, and permissions'
  },
  {
    name: 'Salon Management',
    command: 'npm run test:salon',
    description: 'Salon CRUD operations, search, and availability'
  },
  {
    name: 'Service Management',
    command: 'npm run test service.test.ts',
    description: 'Service CRUD operations, categories, and pricing'
  },
  {
    name: 'Booking System',
    command: 'npm run test:booking',
    description: 'Booking creation, modification, cancellation, and conflicts'
  },
  {
    name: 'OTP Service',
    command: 'npm run test:otp',
    description: 'Email/SMS OTP generation, verification, and development mode'
  },
  {
    name: 'System Configuration',
    command: 'npm run test:config',
    description: 'System settings, admin configuration, and feature toggles'
  },
  {
    name: 'Integration Tests',
    command: 'npm run test:integration',
    description: 'End-to-end booking flows and complex scenarios'
  }
];

class TestRunner {
  private results: { [key: string]: { passed: boolean; duration: number; error?: string } } = {};

  async runAllTests(): Promise<void> {
    logger.info(chalk.blue.bold('\n🧪 CutQ Backend Test Suite\n'));
    logger.info(chalk.gray('Running comprehensive tests for all backend modules...\n'));

    const startTime = Date.now();
    let totalPassed = 0;
    let totalFailed = 0;

    for (const suite of testSuites) {
      await this.runTestSuite(suite);
      if (this.results[suite.name].passed) {
        totalPassed++;
      } else {
        totalFailed++;
      }
    }

    const totalTime = Date.now() - startTime;
    this.printSummary(totalPassed, totalFailed, totalTime);
  }

  async runTestSuite(suite: TestSuite): Promise<void> {
    logger.info(chalk.yellow(`📋 Running ${suite.name} Tests`));
    logger.info(chalk.gray(`   ${suite.description}`));

    const startTime = Date.now();

    try {
      execSync(suite.command, { 
        stdio: 'pipe',
        cwd: process.cwd(),
        timeout: 120000 // 2 minutes timeout
      });

      const duration = Date.now() - startTime;
      this.results[suite.name] = { passed: true, duration };
      
      logger.info(chalk.green(`✅ ${suite.name} Tests PASSED`));
      logger.info(chalk.gray(`   Duration: ${duration}ms\n`));

    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.results[suite.name] = { 
        passed: false, 
        duration, 
        error: error.message 
      };

      logger.info(chalk.red(`❌ ${suite.name} Tests FAILED`));
      logger.info(chalk.gray(`   Duration: ${duration}ms`));
      logger.info(chalk.red(`   Error: ${error.message}\n`));
    }
  }

  printSummary(passed: number, failed: number, totalTime: number): void {
    logger.info(chalk.blue.bold('\n📊 Test Results Summary\n'));

    // Print individual results
    for (const [suiteName, result] of Object.entries(this.results)) {
      const status = result.passed ? chalk.green('PASSED') : chalk.red('FAILED');
      const duration = chalk.gray(`(${result.duration}ms)`);
      logger.info(`${status} ${suiteName} ${duration}`);
    }

    logger.info('\n' + '─'.repeat(50));

    // Print overall summary
    const totalTests = passed + failed;
    const successRate = totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0;
    
    logger.info(chalk.bold(`Total Test Suites: ${totalTests}`));
    logger.info(chalk.green(`Passed: ${passed}`));
    logger.info(chalk.red(`Failed: ${failed}`));
    logger.info(chalk.blue(`Success Rate: ${successRate}%`));
    logger.info(chalk.gray(`Total Time: ${totalTime}ms`));

    if (failed === 0) {
      logger.info(chalk.green.bold('\n🎉 All tests passed! Your backend is ready for deployment.\n'));
    } else {
      logger.info(chalk.red.bold('\n⚠️  Some tests failed. Please review and fix the issues.\n'));
      
      // Print failed test details
      logger.info(chalk.red.bold('Failed Test Details:'));
      for (const [suiteName, result] of Object.entries(this.results)) {
        if (!result.passed) {
          logger.info(chalk.red(`\n❌ ${suiteName}:`));
          logger.info(chalk.gray(`   ${result.error}`));
        }
      }
    }

    logger.info('\n' + '─'.repeat(50));
    logger.info(chalk.blue('💡 Test Commands:'));
    logger.info(chalk.gray('   npm test              - Run all tests'));
    logger.info(chalk.gray('   npm run test:watch    - Run tests in watch mode'));
    logger.info(chalk.gray('   npm run test:coverage - Run tests with coverage'));
    logger.info(chalk.gray('   npm run test:ci       - Run tests for CI/CD'));
    logger.info('');
  }

  async runSpecificTest(testName: string): Promise<void> {
    const suite = testSuites.find(s => 
      s.name.toLowerCase().includes(testName.toLowerCase())
    );

    if (!suite) {
      logger.info(chalk.red(`❌ Test suite "${testName}" not found.`));
      logger.info(chalk.yellow('\nAvailable test suites:'));
      testSuites.forEach(s => {
        logger.info(chalk.gray(`   - ${s.name}: ${s.description}`));
      });
      return;
    }

    logger.info(chalk.blue.bold(`\n🧪 Running ${suite.name} Tests\n`));
    await this.runTestSuite(suite);
    
    const result = this.results[suite.name];
    if (result.passed) {
      logger.info(chalk.green.bold('\n✅ Test completed successfully!\n'));
    } else {
      logger.info(chalk.red.bold('\n❌ Test failed. Please check the output above.\n'));
    }
  }

  async runCoverageReport(): Promise<void> {
    logger.info(chalk.blue.bold('\n📊 Generating Test Coverage Report\n'));

    try {
      execSync('npm run test:coverage', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });

      logger.info(chalk.green.bold('\n✅ Coverage report generated successfully!'));
      logger.info(chalk.gray('Check the coverage/ directory for detailed reports.\n'));

    } catch (error: any) {
      logger.info(chalk.red.bold('\n❌ Failed to generate coverage report.'));
      logger.info(chalk.red(`Error: ${error.message}\n`));
    }
  }

  printHelp(): void {
    logger.info(chalk.blue.bold('\n🧪 CutQ Test Runner\n'));
    logger.info(chalk.yellow('Usage:'));
    logger.info(chalk.gray('  ts-node tests/runTests.ts [command] [options]\n'));
    
    logger.info(chalk.yellow('Commands:'));
    logger.info(chalk.gray('  all                    Run all test suites'));
    logger.info(chalk.gray('  coverage               Generate coverage report'));
    logger.info(chalk.gray('  <test-name>            Run specific test suite'));
    logger.info(chalk.gray('  help                   Show this help message\n'));

    logger.info(chalk.yellow('Available Test Suites:'));
    testSuites.forEach(suite => {
      logger.info(chalk.gray(`  ${suite.name.toLowerCase().padEnd(20)} ${suite.description}`));
    });

    logger.info(chalk.yellow('\nExamples:'));
    logger.info(chalk.gray('  ts-node tests/runTests.ts all'));
    logger.info(chalk.gray('  ts-node tests/runTests.ts auth'));
    logger.info(chalk.gray('  ts-node tests/runTests.ts booking'));
    logger.info(chalk.gray('  ts-node tests/runTests.ts coverage\n'));
  }
}

// Main execution
async function main() {
  const runner = new TestRunner();
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  switch (command) {
    case 'all':
    case undefined:
      await runner.runAllTests();
      break;
    
    case 'coverage':
      await runner.runCoverageReport();
      break;
    
    case 'help':
    case '--help':
    case '-h':
      runner.printHelp();
      break;
    
    default:
      await runner.runSpecificTest(command);
      break;
  }
}

// Handle process termination
process.on('SIGINT', () => {
  logger.info(chalk.yellow('\n\n⚠️  Test execution interrupted by user.'));
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.info(chalk.red('\n❌ Uncaught exception:'), error.message);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  logger.info(chalk.red('\n❌ Test runner failed:'), error.message);
  process.exit(1);
});
