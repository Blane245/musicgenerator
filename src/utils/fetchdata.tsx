// issue the fetch request for file list or specific file
export default async function fetchData(
  uri: string,
  method: string,
  body?: object,
  retries = 3,
) {
  try {
    const thisBody: string | null = body ? JSON.stringify(body) : null;
    const response: Response = await fetch(uri, {
      method: method,
      headers: {
        Accept: "*/*",
        "Content-Type": "text/html",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Request-Headers": "*",
      },
      // mode: "no-cors",
      body: thisBody,
    });
    if (response.ok) {
      const jsonResponse: any = await response.json();
      return jsonResponse;
    } else {
      return { error: true };
    }
  } catch (e:any) {
    // if (retries > 0 && e.message == "Failed to fetch") {
    //   console.warn(`Retrying fetch to ${uri} (${retries} retries left)`);
    //   return fetchData(uri, method, body, retries - 1);
    // }
    return { error: true };
  }
}
