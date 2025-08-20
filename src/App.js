import React, { useState, useEffect } from 'react';
import { Search, Star, Heart, ArrowLeft, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const API_KEY = 'c06cf20217f8cf5f1dbaecebb010e2a1';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const MovieApp = () => {
  const [currentPage, setCurrentPage] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Carrega favoritos do estado local na inicialização
  useEffect(() => {
    const savedFavorites = JSON.parse(sessionStorage.getItem('movieFavorites') || '[]');
    setFavorites(savedFavorites);
  }, []);

  // Salva favoritos no estado local
  const saveFavorites = (newFavorites) => {
    setFavorites(newFavorites);
    sessionStorage.setItem('movieFavorites', JSON.stringify(newFavorites));
  };

  const searchMovies = async (query, page = 1) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Chamada real para a API do TMDB
      const response = await fetch(
        `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=pt-BR`
      );
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const data = await response.json();
      
      setMovies(data.results || []);
      setTotalPages(Math.min(data.total_pages || 0, 500)); // TMDB limita a 500 páginas
      setCurrentPageNum(page);
      setLoading(false);
      
    } catch (err) {
      console.error('Erro ao buscar filmes:', err);
      setError('Erro ao buscar filmes. Verifique sua conexão e tente novamente.');
      setLoading(false);
    }
  };

  const getMovieDetails = async (movieId) => {
    setLoading(true);
    setError('');
    
    try {
      // Buscar detalhes do filme
      const movieResponse = await fetch(
        `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=pt-BR`
      );
      
      // Buscar créditos (elenco e equipe)
      const creditsResponse = await fetch(
        `${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`
      );
      
      if (!movieResponse.ok || !creditsResponse.ok) {
        throw new Error('Erro ao carregar detalhes do filme');
      }
      
      const movieData = await movieResponse.json();
      const creditsData = await creditsResponse.json();
      
      const movieDetails = {
        ...movieData,
        credits: creditsData
      };
      
      setMovieDetails(movieDetails);
      setLoading(false);
      
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      setError('Erro ao carregar detalhes do filme. Tente novamente.');
      setLoading(false);
    }
  };

  const toggleFavorite = (movie) => {
    const isAlreadyFavorite = favorites.some(fav => fav.id === movie.id);
    let newFavorites;
    
    if (isAlreadyFavorite) {
      newFavorites = favorites.filter(fav => fav.id !== movie.id);
    } else {
      newFavorites = [...favorites, movie];
    }
    
    saveFavorites(newFavorites);
  };

  const isFavorite = (movieId) => {
    return favorites.some(fav => fav.id === movieId);
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      searchMovies(searchQuery, 1);
    }
  };

  const handlePageChange = (newPage) => {
    searchMovies(searchQuery, newPage);
  };

  const renderSearchPage = () => (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-400">
          🎬 Busca de Filmes
        </h1>
        
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o nome do filme..."
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
              className="w-full px-4 py-3 pl-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Buscar
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-300">Buscando filmes...</span>
          </div>
        ) : (
          <>
            {movies.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {movies.map((movie) => (
                    <div
                      key={movie.id}
                      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <div className="relative">
                        <img
                          src={movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : '/api/placeholder/300/450'}
                          alt={movie.title}
                          className="w-full h-80 object-cover"
                        />
                        <button
                          onClick={() => toggleFavorite(movie)}
                          className={`absolute top-2 right-2 p-2 rounded-full ${
                            isFavorite(movie.id) ? 'bg-red-600' : 'bg-gray-900/70'
                          } hover:bg-red-700 transition-colors`}
                        >
                          <Heart className={`h-5 w-5 ${isFavorite(movie.id) ? 'fill-white' : ''}`} />
                        </button>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-2 line-clamp-2">{movie.title}</h3>
                        <p className="text-gray-400 text-sm mb-3">
                          {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm">{movie.vote_average?.toFixed(1) || 'N/A'}</span>
                          </div>
                          
                          <button
                            onClick={() => {
                              setSelectedMovie(movie.id);
                              getMovieDetails(movie.id);
                              setCurrentPage('details');
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                          >
                            Ver Detalhes
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginação */}
                <div className="flex justify-center items-center gap-4">
                  <button
                    onClick={() => handlePageChange(currentPageNum - 1)}
                    disabled={currentPageNum <= 1}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Anterior
                  </button>
                  
                  <span className="text-gray-300">
                    Página {currentPageNum} de {totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(currentPageNum + 1)}
                    disabled={currentPageNum >= totalPages}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 rounded-lg transition-colors"
                  >
                    Próxima
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderDetailsPage = () => (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => setCurrentPage('search')}
          className="flex items-center gap-2 mb-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Busca
        </button>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-300">Carregando detalhes...</span>
          </div>
        ) : movieDetails ? (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Poster */}
              <div className="lg:col-span-1">
                <img
                  src={movieDetails.poster_path ? `${IMAGE_BASE_URL}${movieDetails.poster_path}` : '/api/placeholder/400/600'}
                  alt={movieDetails.title}
                  className="w-full rounded-lg shadow-xl"
                />
                
                <button
                  onClick={() => toggleFavorite(movieDetails)}
                  className={`w-full mt-4 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    isFavorite(movieDetails.id) 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isFavorite(movieDetails.id) ? 'fill-white' : ''}`} />
                  {isFavorite(movieDetails.id) ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                </button>
              </div>

              {/* Detalhes */}
              <div className="lg:col-span-2">
                <h1 className="text-4xl font-bold mb-4 text-blue-400">{movieDetails.title}</h1>
                
                <div className="flex flex-wrap items-center gap-4 mb-6 text-gray-300">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span>{movieDetails.vote_average?.toFixed(1)}/10</span>
                  </div>
                  <span>{new Date(movieDetails.release_date).getFullYear()}</span>
                  <span>{movieDetails.runtime} min</span>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">Gêneros</h3>
                  <div className="flex flex-wrap gap-2">
                    {movieDetails.genres?.map((genre) => (
                      <span
                        key={genre.id}
                        className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">Sinopse</h3>
                  <p className="text-gray-300 leading-relaxed">{movieDetails.overview}</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">Direção</h3>
                  <div className="flex flex-wrap gap-2">
                    {movieDetails.credits?.crew
                      ?.filter(person => person.job === 'Director')
                      .map((director) => (
                        <span key={director.id} className="text-gray-300">
                          {director.name}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">Elenco Principal</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {movieDetails.credits?.cast?.slice(0, 6).map((actor) => (
                      <div key={actor.id} className="text-gray-300">
                        <span className="font-medium">{actor.name}</span>
                        <span className="text-gray-500"> como {actor.character}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Produção</h3>
                  <div className="flex flex-wrap gap-2">
                    {movieDetails.production_companies?.map((company) => (
                      <span
                        key={company.id}
                        className="px-3 py-1 bg-gray-800 text-gray-200 rounded text-sm"
                      >
                        {company.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  const renderFavoritesPage = () => (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-red-400">
          ❤️ Meus Favoritos
        </h1>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <p className="text-xl text-gray-400">Nenhum filme favorito ainda.</p>
            <button
              onClick={() => setCurrentPage('search')}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Buscar Filmes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((movie) => (
              <div
                key={movie.id}
                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="relative">
                  <img
                    src={movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : '/api/placeholder/300/450'}
                    alt={movie.title}
                    className="w-full h-80 object-cover"
                  />
                  <button
                    onClick={() => toggleFavorite(movie)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    <Heart className="h-5 w-5 fill-white" />
                  </button>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{movie.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm">{movie.vote_average?.toFixed(1) || 'N/A'}</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedMovie(movie.id);
                        getMovieDetails(movie.id);
                        setCurrentPage('details');
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Navegação */}
      <nav className="bg-gray-800 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <button
                onClick={() => setCurrentPage('search')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'search' 
                    ? 'bg-blue-700 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                🔍 Buscar
              </button>
              <button
                onClick={() => setCurrentPage('favorites')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentPage === 'favorites' 
                    ? 'bg-red-700 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Heart className="h-4 w-4" />
                Favoritos ({favorites.length})
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo */}
      {currentPage === 'search' && renderSearchPage()}
      {currentPage === 'details' && renderDetailsPage()}
      {currentPage === 'favorites' && renderFavoritesPage()}
    </div>
  );
};

export default MovieApp;