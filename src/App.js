import './App.css';
import React from 'react';
import $ from 'jquery';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    useParams
} from "react-router-dom";

class FilmCard extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        const {id, name, date, vote, image, favorite, addToFavorite, genre_names} = this.props.data;
        return (

            <div className="film-card d-flex mb-4 border border-secondary p-2 rounded">
                <div className="film-card__img pe-2 position-relative">
                    <div className="film-card__rating">
                        {vote.toString().length === 1 ? vote + ".0" : vote}
                    </div>
                    <img src={"https://image.tmdb.org/t/p/original" + image} alt="film-img" height="120" width="120"/>

                </div>
                <div className="film-card__desc text-start">
                    <Link to={'/movie/' + id}>
                        <h3 className="film-card__name" style={{'color': '#000'}}>{name}</h3>
                    </Link>
                    <p className="my-0 font-italic">{date} {genre_names.join(', ')}</p>
                    {favorite
                        ? <p className="film-card__favorite">В избранном</p>
                        : <p className="film-card__add-favorite text-decoration-underline" onClick={() => {addToFavorite(id)}}>Добавить в избранное</p>}
                </div>

            </div>
        );
    }

}

class Filter extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {

        const options = Object.entries(this.props.genres).map(item =>
            <option key={item[0]} value={item[0]}>{item[1]}</option>
        );
        return (

            <div className="filter d-flex flex-column align-items-start">
                <div className="filter__by-param align-self-start mb-4">
                    <div className="filter__by-genre">
                        <select className="browser-default custom-select form-control" defaultValue={0} onChange={this.props.onFilterByGenre}>
                            <option value={-1}>Выберите жанр</option>
                            {options}
                        </select>


                    </div>
                </div>
                <div className="filter__sort  btn-group mb-4">
                    <button onClick={this.props.onFilterByPopularity} className={'filter__sort-by-popularity btn btn-secondary' +
                    (this.props.filter_method === 'popular' ? " active" : "")}>
                        По популярности
                    </button >
                    <button onClick={this.props.onFilterByRating} className={'filter__sort-by-rating btn btn-secondary' +
                    (this.props.filter_method === 'top_rated' ? " active" : "")}>
                        По рейтингу
                    </button >

                    <button onClick={this.props.onSortByDate} className={'filter__sort-by-rating btn btn-secondary'}>
                        Отсорировать по дате
                    </button >
                </div>
            </div>
        );
    }
}

class MainComponent extends React.Component {

    static film_blocked = false;

    constructor(props) {
        super(props);
        this.state = {
            page: 1,
            films: [],
            filtered_films: [],
            filter_method: "top_rated",
            filter_params: [],
            filter_genre: -1,
            sort_by_date: false,
            genres: {},
            favorites: [],
        };
        this.filterByRating = this.filterByRating.bind(this);
        this.filterByPopularity = this.filterByPopularity.bind(this);
        this.filterByGenre = this.filterByGenre.bind(this);
        this.sortByDate = this.sortByDate.bind(this);
        this.addToFavorite = this.addToFavorite.bind(this);

        this.updateFilmList = this.updateFilmList.bind(this,
            document.querySelector('html'));
    }

    addToFavorite(id) {
        this.setState(state => ({
            favorites: [...state.favorites, id]
        }), () => {
            localStorage.setItem('favorites', this.state.favorites);
        });
    }

    getFavorites() {
        let favorites;
        if (!(favorites = localStorage.getItem('favorites'))) return;
        this.setState({
            favorites: favorites.split(',').map(item => +item)
        });
    }

    sortByDate() {

        let genre = this.state.filter_genre;
        let change = genre !== -1 ? this.state.filtered_films : this.state.films;
        change.sort((i1, i2) => {
            let v1 = Date.parse(i1.release_date).valueOf();
            let v2 = Date.parse(i2.release_date).valueOf();
            return v2 - v1;
        });
        this.setState({
           [genre !== -1 ? 'filtered_films' : 'films']: change,
        });
    }

    filterBy(method) {
        if (this.state.filter_method === method)
            return;

        if (this.state.filter_genre !== -1) {
            this.getFilteredFilms((films, filtered_films, page) => {
                this.setState(state => ({
                    films,
                    filtered_films: filtered_films,
                    filter_method: method,
                    page,
                }));

            }, 1, method, this.state.filter_genre, 20)
        } else {
            this.getFilms(data => {
                this.setState({
                    films: data.results,
                    filter_method: method
                })
            }, 1, method);
        }
    }

    filterByRating() {
        this.filterBy('top_rated');
    }

    filterByPopularity() {
        this.filterBy('popular');
    }

    filterByGenre(event) {
        let genre_id = +event.target.value;

        if (genre_id === -1) {
            this.getFilms(data => {
                this.setState({
                    films: data.results,
                    filter_genre: -1,
                    page: 1,
                })
            }, 1, this.state.filter_method);
            return;
        }

        let current_filtered = this.state.films.filter(item => {
            return item.genre_ids.includes(genre_id);
        });

        if (current_filtered.length < 20) {
            this.getFilteredFilms((films, filtered_films, page) => {
                this.setState(state => ({
                    films: [...state.films, ...films],
                    filtered_films: [...current_filtered, ...filtered_films],
                    page,
                    filter_genre: genre_id,
                }));
            }, this.state.page, this.state.filter_method, genre_id, 20 - current_filtered.length);
        } else {
            this.setState({
                filtered_films: current_filtered,
                filter_genre: genre_id,
            });
        }
    }

    updateFilmList(html) {

        if (!MainComponent.film_blocked && html.scrollTop + html.clientHeight >= html.scrollHeight && window.location.pathname === '/') {
            MainComponent.film_blocked = true;

            if (this.state.filter_genre !== -1) {
                this.getFilteredFilms((films, filtered_films, page) => {
                    this.setState(state => ({
                        films: [...state.films, ...films],
                        filtered_films: [...state.filtered_films, ...filtered_films],
                        page,
                    }));
                    MainComponent.film_blocked = false;
                }, this.state.page, this.state.filter_method, this.state.filter_genre, 20)
            } else {
                this.getFilms((data) => {
                    this.setState((state) => ({
                        page: this.state.page + 1,
                        films: [...state.films, ...data.results]
                    }));
                    MainComponent.film_blocked = false;
                }, this.state.page + 1, this.state.filter_method);
            }

        }
    }

    getFilms(callback = () => {}, page, method, async = true) {
        $.ajax(
            "https://api.themoviedb.org/3/movie/" + method,
            {
                async: async,
                method: "GET",
                data: {
                    api_key: '4237669ebd35e8010beee2f55fd45546',
                    language: 'ru-RU',
                    page: page,
                }
            }
        ).done(data => {
            callback(data);
        });
    }

    async getFilteredFilms(callback = () => {}, page, method, genre_id, count) {

        let getFilmsPromise = (page, method) => {
            return new Promise((resolve) => {
                this.getFilms((data) => {
                    resolve(data);
                }, page, method);
            });
        }

        let times = 0;
        let films = (await getFilmsPromise(++page, method)).results;
        let filtered_films = films.filter(item => {
            return item.genre_ids.includes(genre_id);
        });

        while (filtered_films.length < count && ++times < 10) {
            let data = await getFilmsPromise(++page, method);

            films.push(...data.results);
            filtered_films.push(...data.results.filter(item => {
                return item.genre_ids.includes(genre_id);
            }));
        }
        callback(films, filtered_films, page);
    }

    getGenres(callback = () => {}) {
        $.ajax('https://api.themoviedb.org/3/genre/movie/list',
            {
                async: true,
                method: "GET",
                data: {
                    api_key: '4237669ebd35e8010beee2f55fd45546',
                    language: 'ru_RU'
                }
            }
        ).done(data => {
            callback(data);
        });
    }

    componentDidMount() {
        this.getFavorites();
        this.getGenres(data => {
            this.setState({
                genres: data.genres.reduce((prev, current) => {
                    prev[current.id] = current.name;
                    return prev;
                }, {}),
            });
        });

        this.getFilms(data => {
            this.setState((state) => ({
                page: 1,
                films: [...state.films, ...data.results]
            }));
        }, 1, this.state.filter_method);

        window.addEventListener('scroll', this.updateFilmList);

    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.updateFilmList);
    }

    render() {

        const films = this.state[this.state.filter_genre !== -1 ? 'filtered_films' : 'films'].map((item, index) => {
            return <FilmCard data={{
                id: item.id,
                name: item.title,
                date: item.release_date,
                vote: item.vote_average,
                image: item.poster_path,
                favorite: this.state.favorites.includes(item.id),
                addToFavorite: this.addToFavorite,
                genre_names: item.genre_ids.map(id => this.state.genres[id]),
            }} key={index}/>
        });

        return (
            <Router>
                <Switch>
                    <Route exact path="/">
                        <div>
                            <header className="container">
                                <div className="row">
                                    <div className="col-md-9">
                                        <h1>Киноденс - только лучшие фильмы</h1>
                                        <p>Рейтинг составляется на основании лучших фильмов</p>
                                    </div>
                                    <div className="col-md-3">
                                        <img
                                            src="https://avatars.mds.yandex.net/get-bunker/128809/7a75352a7ca1db97e6d6678e35532541a1937540/orig"
                                            alt="logo" width={120} height={120}/>
                                    </div>
                                </div>

                            </header>
                            <main className="container">
                                <Filter filter_method={this.state.filter_method}
                                        onFilterByRating={this.filterByRating}
                                        onFilterByPopularity={this.filterByPopularity}
                                        onFilterByGenre={this.filterByGenre}
                                        onSortByDate={this.sortByDate}
                                        genres={this.state.genres}/>
                                <div className="films text-center">
                                    <h2 className="mb-5">Все фильмы</h2>
                                    <div className="film-cards">
                                        {films}
                                    </div>
                                    <div className="film-footer">
                                        <h2 className="text-center">Загружаем фильмы....</h2>
                                    </div>
                                </div>

                            </main>
                        </div>
                    </Route>
                    <Route path="/movie/:id">
                        <MovieCard films={this.state.films}/>
                    </Route>
                </Switch>
            </Router>

        )
    }
}

function MovieCard(props) {
    let {id} = useParams();
    const film = props.films.find(item => {
        return +item.id === +id;
    });
    return (
        <div className="container-lg pt-5 px-4">
            <div className="row">
                <div className="col-lg-3">
                    <div className="poster__container">
                        <img src={"https://image.tmdb.org/t/p/original" + film.poster_path} alt="" className="poster__image" width={220} height={320}/>
                    </div>
                </div>
                <div className="col-lg-9">
                    <h1>{film.title}</h1>
                    <p>{film.overview}</p>
                    <table cellPadding={5} cellSpacing={30}>
                        <thead>
                        <tr>
                            <td><h3>О Фильме</h3></td>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>Год производства</td>
                            <td>{film.release_date.substr(0, 4)}</td>
                        </tr>
                        <tr>
                            <td>Жанр</td>
                            <td>Триллер, Приключение</td>
                        </tr>
                        <tr>
                            <td>Средняя оценка</td>
                            <td>{film.vote_average}</td>
                        </tr>
                        <tr>
                            <td>Для взрослых</td>
                            <td>{film.adult ? 'Да' : 'Нет'}</td>
                        </tr>
                        </tbody>

                    </table>
                </div>
            </div>
        </div>

    );
}


function App() {
  return (
      <MainComponent />
  )
}

export default App;
