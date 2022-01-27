import './main.css';
import 'bootstrap';
import onChange from 'on-change';
import * as yup from 'yup';
import i18next from "i18next";
import axios from 'axios'
import * as _ from 'lodash';

export default function init() {
    i18next.init({
        lng: 'ru',
        debug: true,
        resources: {
            ru: {
                translation: {
                    "rss_added": "RSS успешно загружен",
                    "invalid_url": "Ссылка должна быть валидным URL"
                }
            },
            en: {
                translation: {
                    "rss_added": "RSS loaded successfully",
                    "invalid_url": "The link must be a valid URL"
                }
            }
        }
    });

    const formEl = document.querySelector('.form');
    const inputEl = document.querySelector('.form-control');
    const textDanger = document.querySelector('.text-danger');
    const buttonElModal = document.querySelector('.btn-modal');
    const regExp = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;

    const schema = yup.string().matches(regExp).required();

    const state = {
        feedsUrl: [],
        form: {
            valid: null,
            value: null,
        },
        feeds: [],
    }

    function render(state) {
        if (!state.form.hasParsingError) {
            if (state.form.valid) {
                inputEl.classList.remove('error');
                textDanger.textContent = i18next.t('rss_added');
                textDanger.style.color = 'green';

                const feeds = document.querySelector('.feeds');
                const h2ElFeeds = document.createElement('h2');
                const h2ElPosts = document.createElement('h2');

                h2ElFeeds.classList.add('feeds-posts');
                h2ElPosts.classList.add('feeds-posts');
                h2ElFeeds.textContent = 'Фиды';
                h2ElPosts.textContent = 'Посты';

                feeds.innerHTML = '';
                feeds.append(h2ElFeeds, h2ElPosts);

                state.feeds.map((feed) => {
                    const h3El = document.createElement('h3');
                    feeds.append(h3El);
                    h3El.textContent = feed.title;

                    const h4El = document.createElement('h4');
                    feeds.append(h4El);
                    h4El.textContent = feed.description;
                    feed.posts.map((post) => {
                        const aEl = document.createElement('a');
                        aEl.setAttribute('href', post.link);
                        aEl.textContent = post.title;
                        if (post.class === 'readed') {
                            aEl.setAttribute('class', 'fw-normal');
                        } else {
                            aEl.setAttribute('class', 'fw-bold');
                        }
                        const buttonEl = document.createElement('button');
                        buttonEl.textContent = 'Просмотр';
                        const handler = () => {
                            const myModal = new bootstrap.Modal(document.getElementById('modalWindow'));
                            const modalTitleContent = document.querySelector('.modal-title');
                            modalTitleContent.textContent = post.title;
                            const modalBodyContent = document.querySelector('.modal-body');
                            modalBodyContent.textContent = post.description;
                            const modalReadButton = document.querySelector('.btn-primary');
                            modalReadButton.setAttribute('href', post.link);
                            modalReadButton.setAttribute('target', '_blank');
                            aEl.setAttribute('class', 'fw-normal');
                            post.class = 'readed';
                            myModal.show();
                        }
                        buttonEl.addEventListener('click', handler);
                        feeds.append(aEl, buttonEl);
                    });
                });

                form.reset();
                inputEl.focus();
            } else {
                inputEl.classList.add('error');
                textDanger.textContent = i18next.t('invalid_url');
                textDanger.style.color = 'red';
            }
        } else {
            const feeds = document.querySelector('.feeds');
            feeds.innerHTML = '';
            const h2ElParsingError = document.createElement('h2');
            h2ElParsingError.textContent = 'Parsing Error!';
            feeds.append(h2ElParsingError);
        }
    }

    /*const watchedState = onChange(state, (path, value, previousValue) => {
        if (path === 'form.valid' && value === true) {
    
        }
        render(state);
      });*/

    const parser = new DOMParser();
    /*let counter = 0;
    const parsedDocument = (feed) => {
        counter++;
        if (counter % 2 === 0) {
            throw new Error();
        }
        return parser.parseFromString(feed, "text/xml");
    };*/
    const parsedDocument = (feed) => parser.parseFromString(feed, "text/xml");

    function feedDocItemToPost(feedItemDoc) {
        const feedItemTitle = feedItemDoc.querySelector('item > title').textContent;
        const feedItemDescription = feedItemDoc.querySelector('item > description').textContent;
        const feedItemLink = feedItemDoc.querySelector('link').textContent;
        return {
            title: feedItemTitle,
            description: feedItemDescription,
            link: feedItemLink,
            id: getId(feedItemTitle),
        };
    }

    function rssDocToFeed(rssDoc) {
        const feedTitle = rssDoc.querySelector('channel > title').textContent;
        const feedDescription = rssDoc.querySelector('channel > description').textContent;
        const feedPosts = [...rssDoc.querySelectorAll('item')].map((feedItemDoc) => {
            return feedDocItemToPost(feedItemDoc);
        });
        return {
            title: feedTitle,
            description: feedDescription,
            posts: feedPosts,
        };
    }

    function getId(str) {
        return str.split('').reduce((prevHash, currVal) =>
            (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0);
    }

    formEl.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userInput = formData.get('url');
        state.form.value = userInput;

        schema.isValid(userInput)
            .then((isValid) => {
                if (isValid && !state.feedsUrl.includes(userInput)) {
                    state.feedsUrl.push(userInput);
                    state.form.valid = true;
                    axios
                        .get(userInput)
                        .then(response => {
                            let rssDoc;
                            try {
                                rssDoc = parsedDocument(response.data);
                            }
                            catch (e) {
                                state.form.hasParsingError = true;
                                return;
                            }
                            const feed = rssDocToFeed(rssDoc);
                            const feedId = getId(feed.title)
                            feed.id = feedId;
                            state.feeds.push(feed);
                            console.log(feed);
                        })
                        .then(() => {
                            render(state);
                        })
                        .catch(error => {
                            console.log(error);
                        });
                } else {
                    state.form.valid = false;
                    render(state);
                }
            });
    });

    let timerId = setTimeout(function tick() {
        state.feedsUrl.forEach((url) => {
            axios
                .get(url)
                .then(response => {
                    let rssDoc;
                    try {
                        rssDoc = parsedDocument(response.data);
                    }
                    catch (e) {
                        state.form.hasParsingError = true;
                        return;
                    }
                    const feed = rssDocToFeed(rssDoc);
                    const feedId = getId(feed.title)
                    feed.id = feedId;
                    const ids = feed.posts.map((post) => {
                        return post.id;
                    });

                    const statePostsIds = [];
                    state.feeds.map((item) => {
                        item.posts.map((post) => {
                            statePostsIds.push(post.id);
                        });
                    });
                    const newIds = _.difference(ids, statePostsIds);
                    const newPosts = feed.posts.filter((post) => {
                        return newIds.includes(post.id);
                    });
                    state.feeds.forEach((stateFeed) => {
                        if (stateFeed.id === feedId) {
                            stateFeed.posts.push(...newPosts);
                        }
                    });
                    console.log(state);
                    render(state);
                })
        });
        timerId = setTimeout(tick, 5000);
    }, 5000);
}