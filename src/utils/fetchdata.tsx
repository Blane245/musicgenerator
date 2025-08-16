import { ServerResponse } from "types";

// issue the fetch request for file list or specific file
export default async function fetchData(
  uri: string,
  method: string,
  body?: object | string
): Promise<ServerResponse> {
  try {
    const url: string = `http://localhost:${import.meta.env.SERVERPORT}`;
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
    const json: ServerResponse = await response.json();
    return json;
  } catch (e: any) {
    console.log(`fetch exception ${e}`);
    return { error: true, status: "Local file server not responding." };
  }
}
