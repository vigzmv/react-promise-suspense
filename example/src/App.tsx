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
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: "" };

  // Track a flag rather than the error itself: a promise can reject with a
  // falsy value such as `undefined`, which a truthiness check would miss.
  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  render() {
    if (this.state.hasError) {
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
