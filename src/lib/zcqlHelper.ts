import path from 'path';
import fs from 'fs';

export interface QueryResult {
  success: boolean;
  data: any[];
  queryUsed: string;
  error?: string;
}

// In a real Catalyst environment, we would import and use:
// import * as catalyst from 'zcatalyst-sdk-node';

// Load local database as fallback
function getLocalDatabase() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'sample_fir_data.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading local JSON database:', error);
    return {
      Unit: [],
      CaseMaster: [],
      ComplainantDetails: [],
      Victim: [],
      Accused: [],
      ArrestSurrender: [],
      ActSectionAssociation: [],
      FinancialTransactions: []
    };
  }
}

/**
 * Executes a ZCQL (SQL-like) query against the local synthetic database or Catalyst (in production).
 * Currently emulates ZCQL operations locally for testing and zero-cost offline operations.
 */
export async function executeZCQL(query: string): Promise<QueryResult> {
  const normalizedQuery = query.replace(/\s+/g, ' ').trim();
  const db = getLocalDatabase();

  try {
    // 1. Check if the query is a simple SELECT
    const selectRegex = /SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+JOIN\s+(\w+)\s+ON\s+([\w.]+)\s*=\s*([\w.]+))?(?:\s+WHERE\s+(.+))?/i;
    const match = normalizedQuery.match(selectRegex);

    if (!match) {
      // Fallback: If we can't parse it with regex, try basic string matching
      if (normalizedQuery.toLowerCase().includes('select') && normalizedQuery.toLowerCase().includes('from')) {
        const tableName = normalizedQuery.split(/from/i)[1]?.trim().split(' ')[0];
        if (db[tableName]) {
          return { success: true, data: db[tableName], queryUsed: query };
        }
      }
      return { success: false, data: [], queryUsed: query, error: 'Unsupported or malformed ZCQL syntax' };
    }

    const [, fieldsStr, primaryTable, joinTable, joinLeft, joinRight, whereClause] = match;
    let dataList = [...(db[primaryTable] || [])];

    // Handle Join
    if (joinTable && db[joinTable]) {
      const rightData = db[joinTable];
      const joinedData: any[] = [];

      const leftKey = joinLeft.split('.')[1];
      const rightKey = joinRight.split('.')[1];

      dataList.forEach((leftRow) => {
        const matchingRightRows = rightData.filter(
          (rightRow: any) => rightRow[rightKey] === leftRow[leftKey]
        );

        if (matchingRightRows.length > 0) {
          matchingRightRows.forEach((rightRow: any) => {
            joinedData.push({ ...leftRow, ...rightRow });
          });
        } else {
          // Left join behavior
          joinedData.push({ ...leftRow });
        }
      });
      dataList = joinedData;
    }

    // Handle Where clause (basic parser)
    if (whereClause) {
      // Check for operators: =, LIKE, IN
      const cleanWhere = whereClause.replace(/;/g, '').trim();

      if (cleanWhere.includes('=')) {
        const parts = cleanWhere.split('=');
        const col = parts[0].trim().replace(/^[\w]+\./, ''); // remove table prefix
        let val = parts[1].trim().replace(/['"]/g, ''); // strip quotes

        dataList = dataList.filter((row) => String(row[col]).toLowerCase() === val.toLowerCase());
      } else if (cleanWhere.toLowerCase().includes('like')) {
        const parts = cleanWhere.split(/like/i);
        const col = parts[0].trim().replace(/^[\w]+\./, '');
        let val = parts[1].trim().replace(/['"%]/g, '').toLowerCase(); // strip quotes and wildcard %

        dataList = dataList.filter((row) => 
          row[col] && String(row[col]).toLowerCase().includes(val)
        );
      }
    }

    // Field selection
    const selectedFields = fieldsStr.split(',').map((f) => f.trim());
    if (selectedFields[0] !== '*') {
      dataList = dataList.map((row) => {
        const projectedRow: any = {};
        selectedFields.forEach((field) => {
          const cleanField = field.replace(/^[\w]+\./, ''); // remove table prefix if any
          projectedRow[cleanField] = row[cleanField] !== undefined ? row[cleanField] : null;
        });
        return projectedRow;
      });
    }

    return {
      success: true,
      data: dataList,
      queryUsed: query
    };
  } catch (err: any) {
    return {
      success: false,
      data: [],
      queryUsed: query,
      error: err.message || 'Database query execution error'
    };
  }
}
