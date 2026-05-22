import { Component, type ReactNode, Suspense } from "react";
import usePromise from "react-promise-suspense";

interface Pokemon {
  id: number;
  name: string;
}

const fetchPokemon = (name: string): Promise<Pokemon> =>
  fetch(`https://pokeapi.co/api/v2/pokemon/${name}/`).then((res) => {
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  });

function PokemonCard({ name }: { name: string }) {
  // Suspends until the fetch resolves; returns the cached result afterwards.
  const pokemon = usePromise(fetchPokemon, [name]);
  return (
    <pre>
      #{pokemon.id} {pokemon.name}
    </pre>
  );
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <p>Something went wrong: {this.state.error.message}</p>;
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<p>Loading…</p>}>
        <PokemonCard name="ditto" />
      </Suspense>
    </ErrorBoundary>
  );
}
