import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper to determine if Catalyst environment variables are active
const isCatalystActive = () => {
  return !!(process.env.CATALYST_PROJECT_ID || process.env.CATALYST_PROJECT_KEY || process.env.CATALYST_APP_ID);
};

// Helper to extract a column value compatibly from both flat and nested ZCQL results
const getVal = (row: any, tableName: string, columnName: string) => {
  if (row[tableName] && row[tableName][columnName] !== undefined) {
    return row[tableName][columnName];
  }
  return row[columnName];
};

export async function GET(req: Request) {
  try {
    if (isCatalystActive()) {
      try {
        // @ts-ignore
        const requireFunc = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : eval('require');
        const catalyst = requireFunc('zcatalyst-sdk-node');
        const app = catalyst.initialize(req);
        const zcql = app.zcql();

        // 1. Fetch sessions and messages
        const sessionsResult = await zcql.executeZCQLQuery('SELECT * FROM ChatSessions');
        const messagesResult = await zcql.executeZCQLQuery('SELECT * FROM ChatMessages');
        
        const sessions = sessionsResult || [];
        const messages = messagesResult || [];
        
        const result: Record<string, { title: string; messages: any[] }> = {};
        
        // 2. Map sessions
        sessions.forEach((row: any) => {
          const sessionId = getVal(row, 'ChatSessions', 'SessionID');
          const title = getVal(row, 'ChatSessions', 'Title');
          if (sessionId) {
            result[sessionId] = {
              title: title || 'New Investigation',
              messages: []
            };
          }
        });
        
        // 3. Map messages (adapted to Catalyst schema columns: Role, Content, MsgTimestamp)
        messages.forEach((row: any) => {
          const sessionId = getVal(row, 'ChatMessages', 'SessionID');
          const role = getVal(row, 'ChatMessages', 'Role');
          const content = getVal(row, 'ChatMessages', 'Content');
          const msgTimestamp = getVal(row, 'ChatMessages', 'MsgTimestamp');
          const rowId = getVal(row, 'ChatMessages', 'ROWID');
          
          if (sessionId && result[sessionId]) {
            let msgText = content || '';
            let isCustomUI = false;
            let cases: any[] = [];
            let modusOperandi: string[] = [];
            let keyInsights: any = null;

            if (content && content.trim().startsWith('{') && content.trim().endsWith('}')) {
              try {
                const parsed = JSON.parse(content);
                msgText = parsed.text || '';
                isCustomUI = !!parsed.isCustomUI;
                cases = parsed.cases || [];
                modusOperandi = parsed.modusOperandi || [];
                keyInsights = parsed.keyInsights || null;
              } catch (e) {
                msgText = content;
              }
            } else {
              isCustomUI = role === 'ai' && (msgText.toLowerCase().includes('pattern') || msgText.toLowerCase().includes('similar'));
            }

            result[sessionId].messages.push({
              id: rowId ? String(rowId) : Math.random().toString(),
              sender: role || 'user',
              text: msgText,
              timestamp: msgTimestamp || '',
              isCustomUI,
              cases,
              modusOperandi,
              keyInsights
            });
          }
        });
        
        return NextResponse.json(result);
      } catch (err) {
        console.warn('Catalyst conversations GET failed, falling back to local file:', err);
      }
    }

    // Fallback local JSON database file
    const filePath = path.join(process.cwd(), 'public', 'conversations.json');
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}, null, 2), 'utf8');
      return NextResponse.json({});
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const updatedMap = await req.json();
  try {
    if (isCatalystActive()) {
      try {
        // @ts-ignore
        const requireFunc = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : eval('require');
        const catalyst = requireFunc('zcatalyst-sdk-node');
        const app = catalyst.initialize(req);
        const datastore = app.datastore();
        const zcql = app.zcql();
        
        const chatSessionsTable = datastore.table('ChatSessions');
        const chatMessagesTable = datastore.table('ChatMessages');

        // 1. Fetch current rows to determine what to delete or update
        const existingSessionsResult = await zcql.executeZCQLQuery('SELECT ROWID, SessionID FROM ChatSessions');
        const existingMessagesResult = await zcql.executeZCQLQuery('SELECT ROWID, SessionID FROM ChatMessages');
        
        const existingSessions = existingSessionsResult || [];
        const existingMessages = existingMessagesResult || [];

        // 2. Delete sessions that are no longer in the updatedMap
        for (const row of existingSessions) {
          const sessId = getVal(row, 'ChatSessions', 'SessionID');
          const rowId = getVal(row, 'ChatSessions', 'ROWID');
          if (sessId && !updatedMap[sessId] && rowId) {
            await chatSessionsTable.deleteRow(rowId);
          }
        }

        // Delete messages that belong to deleted sessions or are no longer present
        for (const row of existingMessages) {
          const sessId = getVal(row, 'ChatMessages', 'SessionID');
          const rowId = getVal(row, 'ChatMessages', 'ROWID');
          if (rowId && (!sessId || !updatedMap[sessId])) {
            await chatMessagesTable.deleteRow(rowId);
          }
        }

        // 3. For each active session in the new map, check if it exists or needs insert/update
        for (const [sessionId, session] of Object.entries(updatedMap) as [string, any][]) {
          const matchedSessionRow = existingSessions.find(
            (row: any) => getVal(row, 'ChatSessions', 'SessionID') === sessionId
          );

          if (!matchedSessionRow) {
            await chatSessionsTable.insertRow({
              SessionID: sessionId,
              UserID: '1898733',
              Title: session.title
            });
          } else {
            const existingTitle = getVal(matchedSessionRow, 'ChatSessions', 'Title');
            const rowId = getVal(matchedSessionRow, 'ChatSessions', 'ROWID');
            if (existingTitle !== session.title && rowId) {
              await chatSessionsTable.updateRow({
                ROWID: rowId,
                SessionID: sessionId,
                Title: session.title
              });
            }
          }

          const sessionMsgRowsToDelete = existingMessages.filter(
            (row: any) => getVal(row, 'ChatMessages', 'SessionID') === sessionId
          );
          for (const row of sessionMsgRowsToDelete) {
            const rowId = getVal(row, 'ChatMessages', 'ROWID');
            if (rowId) {
              await chatMessagesTable.deleteRow(rowId);
            }
          }

          const messagesToInsert = (session.messages || []).map((m: any) => {
            let contentValue = m.text;
            if (m.isCustomUI) {
              contentValue = JSON.stringify({
                text: m.text,
                isCustomUI: true,
                cases: m.cases || [],
                modusOperandi: m.modusOperandi || [],
                keyInsights: m.keyInsights || null
              });
            }
            return {
              SessionID: sessionId,
              Role: m.sender,
              Content: contentValue,
              MsgTimestamp: m.timestamp
            };
          });

          if (messagesToInsert.length > 0) {
            await chatMessagesTable.insertRows(messagesToInsert);
          }
        }

        return NextResponse.json({ success: true });
      } catch (err) {
        console.warn('Catalyst conversations POST failed, falling back to local file:', err);
      }
    }

    // Local fallback JSON file persistence
    const filePath = path.join(process.cwd(), 'public', 'conversations.json');
    fs.writeFileSync(filePath, JSON.stringify(updatedMap, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving conversations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
