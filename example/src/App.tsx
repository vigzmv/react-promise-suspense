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
  { message: string | null }
> {
  state = { message: null as string | null };

  static getDerivedStateFromError(error: unknown) {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  render() {
    // Compare with null, not truthiness: a rejection may carry an empty message.
    if (this.state.message !== null) {
      return <p>Something went wrong: {this.state.message}</p>;
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
