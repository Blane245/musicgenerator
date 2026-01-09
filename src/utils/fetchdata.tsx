import { DBRESPONSETYPE, DbResponseType, FSResponse } from "../types";

// issue the fetch request for file list or specific file
export async function fetchFSData(
  uri: string,
  method: string,
  body?: object | string
): Promise<FSResponse> {
  try {
    const url: string = `http://localhost:${import.meta.env.FSPORT}`;
    let thisBody: string | null = null;
    if (body && typeof body === "object") {
      thisBody = JSON.stringify(body);
    } else if (typeof body === "string") {
      thisBody = body;
    }
    const response: Response = await fetch(`${url}${uri}`, {
      method: method,
      headers: {
        Accept: "*/*",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": `http://localhost:${
          import.meta.env.PORT
        }`,
      },
      body: thisBody,
    });
    if (!response.ok) return { error: true, status: response.statusText };

    // return either a response from the filesystem or from the database
      const json: FSResponse = await response.json();
      return json;
  } catch (e: any) {
    console.log(`fetch exception ${e} on port ${import.meta.env.FSPORT}`);
      return { error: true, status: `${e}` };
  }
}
// issue the fetch request for file list or specific file
export async function fetchDBData(
  uri: string,
  method: string,
  body?: object | string
): Promise<DbResponseType> {
  try {
    const url: string = `${import.meta.env.DBSERVER}:${import.meta.env.DBPORT}`;
    let thisBody: string | null = null;
    if (body && typeof body === "object") {
      thisBody = JSON.stringify(body);
    } else if (typeof body === "string") {
      thisBody = body;
    }
    const response: Response = await fetch(`${url}${uri}`, {
      method: method,
      headers: {
        Accept: "*/*",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": `${import.meta.env.DBSERVER}:${
          import.meta.env.PORT
        }`,
      },
      body: thisBody,
    });
    if (!response.ok) return { type: DBRESPONSETYPE.error, message: response.statusText };

    // return either a response from the filesystem or from the database
      const json: DbResponseType = await response.json();
      return json;
  } catch (e: any) {
    console.log(`fetch exception ${e} on port ${import.meta.env.DBPORT}`);
      return { type: DBRESPONSETYPE.error, message: `${e}` };
  }
}
