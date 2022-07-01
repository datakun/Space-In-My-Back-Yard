import { load } from 'cheerio';
import express, { Request, Response, NextFunction } from 'express';
import request from 'request';
import client from 'https';
import fs from 'fs';

// functions

const TODAY_URL = 'https://apod.nasa.gov/apod/astropix.html';
const ARCHIVE_URL_PREFIX = 'https://apod.nasa.gov/apod/';
const DOWNLOAD_PATH = './dist/apod/';

const crawl = (url: string) => {
	return new Promise<string>((resolve, reject) => {
		request.get(url, (error, response) => {
			if (error) {
				reject(error);
			}

			resolve(response.body);
		});
	});
};

const extractImageUrl = (html: string): string => {
	if (html === '') {
		throw new Error('html is empty');
	}

	const $ = load(html);
	const crawledRealtimeKeywords = $('body > center > p > a > img');
	const hrefList = $(crawledRealtimeKeywords)
		.map((i, element) => $(element).parent('a'))
		.filter((i, element) => $(element).attr('href') !== undefined)
		.map((i, element) => $(element).attr('href'))
		.get();

	if (hrefList.length === 0) {
		throw new Error('can not find image url');
	}

	return hrefList[0];
};

const downloadImage = (url: string, imagePath: string) => {
	return new Promise<string>((resolve, reject) => {
		client.get(url, (response) => {
			response
				.pipe(fs.createWriteStream(imagePath))
				.on('finish', () => resolve('ok'))
				.on('error', (error: unknown) => reject(error));
		});
	});
};

// start

const app = express();

app.get('/', (request: Request, response: Response, next: NextFunction) => {
	response.send('go to /crawl');
});

app.get('/crawl', async (request: Request, response: Response, next: NextFunction) => {
	try {
		const result = await crawl(TODAY_URL);
		const imageUrl = ARCHIVE_URL_PREFIX + extractImageUrl(result);
		await downloadImage(imageUrl, './' + new Date().toISOString().slice(0, 10) + '.jpg');
		response.send('ok');
	} catch (error) {
		console.error(error);
		response.send(error);
	}
});

app.get('/crawl/:date', async (request: Request, response: Response, next: NextFunction) => {
	try {
		const date = request.params.date;
		// date 가 yyyy-MM-dd 형태인 지 검사
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			throw new Error('date is not yyyy-MM-dd');
		}

		// yyyy-MM-dd -> yyMMdd
		const result = await crawl(ARCHIVE_URL_PREFIX + 'ap' + date.slice(2).replaceAll('-', '') + '.html');
		const imageUrl = ARCHIVE_URL_PREFIX + extractImageUrl(result);
		await downloadImage(imageUrl, DOWNLOAD_PATH + date + '.jpg');
		response.send('ok');
	} catch (error) {
		console.error(error);
		response.send(error);
	}
});

app.listen('8080', () => {
	console.log(`
########################################
Server started on: http://localhost:8080
########################################
`);

	// DOWNLOAD_PATH 경로가 존재하지 않으면 재귀적으로 폴더 만들기
	if (!fs.existsSync(DOWNLOAD_PATH)) {
		fs.mkdirSync(DOWNLOAD_PATH, { recursive: true });
	}

	const platform = process.platform;
	if (platform === 'darwin') {
		// 맥 경로 설정
	} else if (platform === 'win32') {
		// 윈도우 경로 설정
	}
});
