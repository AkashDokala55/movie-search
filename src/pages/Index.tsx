import React, { useState, useEffect, useCallback } from 'react';
import { Search, Star, Calendar, Clock, Film, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
  original_title?: string;
  original_language?: string;
}

const API_KEY = '3fd2be6f0c70a2a598f084ddfb75487c'; // TMDb demo API key
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

// Using a CORS proxy to handle cross-origin requests
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

const MovieSearchApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [movieDetails, setMovieDetails] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  const fetchTrendingMovies = async () => {
    setTrendingLoading(true);
    try {
      const encodedUrl = encodeURIComponent(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=en-US`);
      const url = `${CORS_PROXY}${encodedUrl}`;
      
      console.log('Fetching trending movies...');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Trending movies:', data);
      
      if (data.results && Array.isArray(data.results)) {
        setTrendingMovies(data.results.slice(0, 10)); // Show top 10 trending movies
      }
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      toast({
        title: "Error",
        description: "Failed to load trending movies. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setTrendingLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingMovies();
  }, []);

  const searchMovies = async (query: string) => {
    if (!query.trim()) {
      setMovies([]);
      return;
    }

    setLoading(true);
    try {
      const encodedUrl = encodeURIComponent(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`);
      const url = `${CORS_PROXY}${encodedUrl}`;
      
      console.log('Searching for:', query);
      console.log('Using CORS proxy URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Search results:', data);
      
      if (data.results && Array.isArray(data.results)) {
        setMovies(data.results);
        toast({
          title: "Search Complete",
          description: `Found ${data.results.length} movies for "${query}"`,
        });
      } else {
        setMovies([]);
        toast({
          title: "No Results",
          description: `No movies found for "${query}". Try different spelling or keywords.`,
        });
      }
    } catch (error) {
      console.error('Error searching movies:', error);
      setMovies([]);
      
      toast({
        title: "Connection Error",
        description: "Unable to search movies at the moment. Please try again in a few seconds.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce(searchMovies, 500), []);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const fetchMovieDetails = async (movieId: number) => {
    try {
      const encodedUrl = encodeURIComponent(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits&language=en-US`);
      const url = `${CORS_PROXY}${encodedUrl}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Movie details:', data);
      setMovieDetails(data);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      toast({
        title: "Error",
        description: "Failed to load movie details. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setMovieDetails(null);
    setIsDialogOpen(true);
    fetchMovieDetails(movie.id);
  };

  const handleBackToHome = () => {
    setSearchQuery('');
    setMovies([]);
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
    <Dialog open={isDialogOpen && selectedMovie?.id === movie.id} onOpenChange={(open) => !open && handleBackToHome()}>
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
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-full h-64 bg-gray-800 flex items-center justify-center ${movie.poster_path ? 'hidden' : ''}`}>
              <Film className="w-12 h-12 text-gray-500" />
            </div>
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
            
            {movie.original_title && movie.original_title !== movie.title && (
              <p className="text-purple-300 text-sm mb-2 italic">
                Original: {movie.original_title}
              </p>
            )}
            
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(movie.release_date)}</span>
              {movie.original_language && (
                <>
                  <span>•</span>
                  <span className="uppercase">{movie.original_language}</span>
                </>
              )}
            </div>
            
            <p className="text-gray-300 text-sm line-clamp-3 leading-relaxed">
              {movie.overview || 'No overview available.'}
            </p>
          </div>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800 text-white">
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToHome}
            className="bg-black/50 hover:bg-black/70 text-white border border-gray-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
        
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
                  {movieDetails.original_title && movieDetails.original_title !== movieDetails.title && (
                    <p className="text-purple-300 text-lg mb-2 italic">
                      Original: {movieDetails.original_title}
                    </p>
                  )}
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
                    {movieDetails.original_language && (
                      <span className="uppercase bg-purple-600/20 px-2 py-1 rounded text-purple-300">
                        {movieDetails.original_language}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {!movieDetails.backdrop_path && (
              <div className="text-center mb-6 pt-12">
                <h2 className="text-3xl font-bold text-white mb-4">{movieDetails.title}</h2>
                {movieDetails.original_title && movieDetails.original_title !== movieDetails.title && (
                  <p className="text-purple-300 text-lg mb-4 italic">
                    Original: {movieDetails.original_title}
                  </p>
                )}
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
                  {movieDetails.original_language && (
                    <span className="uppercase bg-purple-600/20 px-2 py-1 rounded text-purple-300">
                      {movieDetails.original_language}
                    </span>
                  )}
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
          <div className="space-y-4 pt-12">
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
            Discover movies from around the world including Indian cinema. Search for Telugu, Hindi, Malayalam, Tamil, and other regional films with accurate spelling.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-2xl mx-auto mb-12">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search for movies... (Try: Baahubali, RRR, Pushpa, KGF, Dangal)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 text-lg bg-gray-900/50 border-gray-700 focus:border-purple-500 transition-colors text-white placeholder:text-gray-400"
          />
          <div className="mt-2 text-sm text-gray-400 text-center">
            💡 Tip: Use exact spelling for best results. Try popular Indian films like "Baahubali", "RRR", "KGF"
          </div>
        </div>

        {/* Back Button - Only show when searching */}
        {searchQuery && (
          <div className="flex justify-center mb-6">
            <Button
              onClick={handleBackToHome}
              variant="outline"
              className="bg-gray-900/50 border-gray-700 hover:bg-gray-800 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Trending
            </Button>
          </div>
        )}

        {/* Search Results or Trending Movies */}
        <div className="fade-in">
          {searchQuery ? (
            // Search Results Section
            loading ? (
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
            ) : (
              <div className="text-center py-16">
                <Film className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No movies found</h3>
                <p className="text-gray-400">Try different spelling or keywords</p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>Common Indian film suggestions:</p>
                  <p>Telugu: Baahubali, RRR, Pushpa, Arjun Reddy</p>
                  <p>Hindi: Dangal, 3 Idiots, Zindagi Na Milegi Dobara</p>
                  <p>Tamil: 2.0, Vikram, Master</p>
                  <p>Malayalam: Drishyam, Kumbakonam Gopals</p>
                </div>
              </div>
            )
          ) : (
            // Trending Movies Section
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2 gradient-text">Trending This Week</h2>
                <p className="text-gray-400">Popular movies people are watching right now</p>
              </div>
              
              {trendingLoading ? (
                <LoadingSkeleton />
              ) : trendingMovies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {trendingMovies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Search className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Start searching</h3>
                  <p className="text-gray-400">Enter a movie title to discover amazing films from India and worldwide</p>
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Popular Indian films to try:</p>
                    <p className="mt-2">🎬 Baahubali • RRR • KGF • Pushpa • Dangal • 3 Idiots</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieSearchApp;
