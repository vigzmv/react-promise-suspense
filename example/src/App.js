import React, { Suspense } from 'react';
import usePromise from '../../';

const fetchJson = input => fetch(input).then(res => console.log(res) || res.json());

const MyFetchingComponent = () => {
  const data = usePromise(fetchJson, [
    'https://pokeapi.co/api/v2/pokemon/ditto/',
    { method: 'GET' },
  ]);

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
