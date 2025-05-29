
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Star, Calendar, Clock, Film } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  backdrop_path: string | null;
  runtime?: number;
}

const API_KEY = '3fd2be6f0c70a2a598f084ddfb75487c'; // TMDb demo API key
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

const MovieSearchApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [movieDetails, setMovieDetails] = useState<any>(null);
  const { toast } = useToast();

  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  const searchMovies = async (query: string) => {
    if (!query.trim()) {
      setMovies([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }
      
      const data = await response.json();
      setMovies(data.results || []);
    } catch (error) {
      console.error('Error searching movies:', error);
      toast({
        title: "Search Error",
        description: "Failed to search movies. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce(searchMovies, 300), []);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const fetchMovieDetails = async (movieId: number) => {
    try {
      const response = await fetch(
        `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch movie details');
      }
      
      const data = await response.json();
      setMovieDetails(data);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      toast({
        title: "Error",
        description: "Failed to load movie details.",
        variant: "destructive",
      });
    }
  };

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setMovieDetails(null);
    fetchMovieDetails(movie.id);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).getFullYear().toString();
  };

  const formatRuntime = (minutes: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const MovieCard = ({ movie }: { movie: Movie }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Card 
          className="movie-card-hover cursor-pointer bg-gray-900/50 border-gray-800 backdrop-blur-sm overflow-hidden group"
          onClick={() => handleMovieClick(movie)}
        >
          <div className="relative">
            {movie.poster_path ? (
              <img
                src={`${IMAGE_BASE_URL}${movie.poster_path}`}
                alt={movie.title}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-64 bg-gray-800 flex items-center justify-center">
                <Film className="w-12 h-12 text-gray-500" />
              </div>
            )}
            <div className="absolute top-2 right-2">
              <Badge className="bg-yellow-500/90 text-black font-semibold">
                <Star className="w-3 h-3 mr-1" />
                {movie.vote_average.toFixed(1)}
              </Badge>
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
              {movie.title}
            </h3>
            
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(movie.release_date)}</span>
            </div>
            
            <p className="text-gray-300 text-sm line-clamp-3 leading-relaxed">
              {movie.overview || 'No overview available.'}
            </p>
          </div>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800 text-white">
        {movieDetails ? (
          <div className="space-y-6">
            {movieDetails.backdrop_path && (
              <div className="relative -mx-6 -mt-6 mb-6">
                <img
                  src={`${BACKDROP_BASE_URL}${movieDetails.backdrop_path}`}
                  alt={movieDetails.title}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6">
                  <h2 className="text-3xl font-bold text-white mb-2">{movieDetails.title}</h2>
                  <div className="flex items-center gap-4 text-gray-300">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      {movieDetails.vote_average.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(movieDetails.release_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatRuntime(movieDetails.runtime)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {!movieDetails.backdrop_path && (
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-4">{movieDetails.title}</h2>
                <div className="flex items-center justify-center gap-4 text-gray-300">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    {movieDetails.vote_average.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(movieDetails.release_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatRuntime(movieDetails.runtime)}
                  </span>
                </div>
              </div>
            )}
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                {movieDetails.poster_path ? (
                  <img
                    src={`${IMAGE_BASE_URL}${movieDetails.poster_path}`}
                    alt={movieDetails.title}
                    className="w-full rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-gray-800 rounded-lg flex items-center justify-center">
                    <Film className="w-16 h-16 text-gray-500" />
                  </div>
                )}
              </div>
              
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-purple-300">Overview</h3>
                  <p className="text-gray-300 leading-relaxed">
                    {movieDetails.overview || 'No overview available.'}
                  </p>
                </div>
                
                {movieDetails.genres && movieDetails.genres.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-purple-300">Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {movieDetails.genres.map((genre: any) => (
                        <Badge key={genre.id} variant="secondary" className="bg-purple-600/20 text-purple-300">
                          {genre.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {movieDetails.credits?.cast && movieDetails.credits.cast.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-purple-300">Cast</h3>
                    <p className="text-gray-300">
                      {movieDetails.credits.cast
                        .slice(0, 5)
                        .map((actor: any) => actor.name)
                        .join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full bg-gray-800" />
            <div className="grid md:grid-cols-3 gap-6">
              <Skeleton className="h-96 bg-gray-800" />
              <div className="md:col-span-2 space-y-4">
                <Skeleton className="h-4 w-3/4 bg-gray-800" />
                <Skeleton className="h-4 w-full bg-gray-800" />
                <Skeleton className="h-4 w-2/3 bg-gray-800" />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {Array.from({ length: 10 }).map((_, index) => (
        <Card key={index} className="bg-gray-900/50 border-gray-800 overflow-hidden">
          <Skeleton className="h-64 w-full bg-gray-800" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4 bg-gray-800" />
            <Skeleton className="h-3 w-1/2 bg-gray-800" />
            <Skeleton className="h-3 w-full bg-gray-800" />
            <Skeleton className="h-3 w-2/3 bg-gray-800" />
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 gradient-text">
            MovieFinder
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover movies from around the world. Search for any film and explore detailed information, ratings, and more.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-2xl mx-auto mb-12">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search for movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 text-lg bg-gray-900/50 border-gray-700 focus:border-purple-500 transition-colors text-white placeholder:text-gray-400"
          />
        </div>

        {/* Results */}
        <div className="fade-in">
          {loading ? (
            <LoadingSkeleton />
          ) : movies.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">
                  Search Results ({movies.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </>
          ) : searchQuery && !loading ? (
            <div className="text-center py-16">
              <Film className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No movies found</h3>
              <p className="text-gray-400">Try searching with different keywords</p>
            </div>
          ) : !searchQuery ? (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Start searching</h3>
              <p className="text-gray-400">Enter a movie title to discover amazing films</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MovieSearchApp;
