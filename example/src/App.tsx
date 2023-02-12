import React, { Suspense } from "react";
import usePromise from "react-promise-suspense";

const fetchJson = (input: RequestInfo | URL) =>
  fetch(input).then((res) => res.json());

const MyFetchingComponent = () => {
  const data = usePromise<[string, { method: string }], Record<string, string>>(
    fetchJson,
    ["https://pokeapi.co/api/v2/pokemon/ditto/", { method: "GET" }]
  );

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
};

const App = () => {
  return (
    <Suspense fallback="Loading...">
      <MyFetchingComponent />
    </Suspense>
  );
};

export default App;
