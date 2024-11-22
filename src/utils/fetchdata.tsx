  // issue the fetch request for file list or specific file
  export default async function fetchData(uri: string, method: string, body?: object) {
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
    } catch (e) {
      return { error: true };
    }
  }
