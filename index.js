import './main.css';
import 'bootstrap';
import onChange from 'on-change';
import * as yup from 'yup';
import i18next from "i18next";
import axios from 'axios'

i18next.init({
    lng: 'ru', // if you're using a language detector, do not define the lng option
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
    if (state.form.valid) {
        inputEl.classList.remove('error');
        textDanger.textContent = i18next.t('rss_added');
        textDanger.style.color = 'green';

        const feeds = document.querySelector('.feeds');
        feeds.innerHTML = '<h2>Фиды</h2>';
        const h3El = document.createElement('h3');
        feeds.append(h3El);
        h3El.textContent = state.feedTitle;

        const h4El = document.createElement('h4');
        feeds.append(h4El);
        h4El.textContent = state.feedDescription;

        // console.log(state);
        form.reset();
        inputEl.focus();
    } else {
        inputEl.classList.add('error');
        textDanger.textContent = i18next.t('invalid_url');
        textDanger.style.color = 'red';
    }
}

/*const watchedState = onChange(state, (path, value, previousValue) => {
    if (path === 'form.valid' && value === true) {

    }
    render(state);
  });*/

const parser = new DOMParser();
const parsedDocument = (feed) => parser.parseFromString(feed, "text/html");

function feedDocItemToPost(feedItemDoc) {
    const feedItemTitle = feedItemDoc.querySelector('item > title').textContent;
    const feedItemDescription = feedItemDoc.querySelector('item > description').textContent;
    const feedItemLink = feedItemDoc.querySelector('link').innerText;
    console.log(feedItemDoc.querySelector('link').textContent, feedItemDoc);
    const feedItemPubdate = feedItemDoc.querySelector('pubdate').textContent;
    return {
        title: feedItemTitle,
        description: feedItemDescription,
        link: feedItemLink,
        pubdate: feedItemPubdate,
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
                        console.log(parsedDocument(response.data));
                        const rssDoc = parsedDocument(response.data);
                        const feed = rssDocToFeed(rssDoc);
                        // console.log(feed, '!!!');
                        state.feeds.push(feed);
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

