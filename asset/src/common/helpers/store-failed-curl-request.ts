import { Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

const logger = new Logger('CurlUtils');

export async function storeFailedCurlRequest(
  url: string,
  method: string,
  data: any,
  headers: any,
  error: any,
): Promise<void> {
  try {
    const logsDir = path.join(process.cwd(), 'files', 'failed-requests');

    await fs.mkdir(logsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `failed-request-${timestamp}.curl`;
    const filePath = path.join(logsDir, filename);

    let curlCommand = `#!/bin/bash\n\n`;
    curlCommand += `# Error: ${error.message}\n`;
    if (error.response?.data) {
      curlCommand += `# Error Body: ${JSON.stringify(error.response.data)}\n`;
    }
    curlCommand += `# Time: ${new Date().toISOString()}\n`;
    curlCommand += `# URL: ${url}\n\n`;

    curlCommand += `curl -X ${method} '${url}'`;

    // Add headers
    for (const [key, value] of Object.entries(headers)) {
      curlCommand += ` \\\n  -H '${key}: ${value}'`;
    }

    // Add body data
    if (data && method !== 'GET') {
      curlCommand += ` \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(data, null, 2)}'`;
    }

    await fs.writeFile(filePath, curlCommand, 'utf-8');
    logger.log(`Failed request curl saved to: ${filePath}`);
  } catch (err) {
    logger.error(`Failed to save curl command: ${err.message}`);
  }
}
