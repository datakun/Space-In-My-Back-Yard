import { load } from 'cheerio';
import express, { Request, Response, NextFunction } from 'express';
import request from 'request';
import client from 'https';
import fs from 'fs';

// functions

const crawl = () => {
	return new Promise<string>((resolve, reject) => {
		request.get('https://apod.nasa.gov/apod/astropix.html', (error, response) => {
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
	const crawledRealtimeKeywords = $('body > center:nth-child(1) > p:nth-child(3) > a');
	const hrefList = $(crawledRealtimeKeywords)
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
	const result = await crawl();
	try {
		const prefix = 'https://apod.nasa.gov/apod/';
		const imageUrl = prefix + extractImageUrl(result);
		await downloadImage(imageUrl, './' + new Date().toISOString().slice(0, 10) + '.jpg');
		response.send('ok');
	} catch (error) {
		response.send(error);
	}
});

app.listen('8080', () => {
	console.log(`
########################################
Server started on: http://localhost:8080
########################################
`);

	const platform = process.platform;
	if (platform === 'darwin') {
		// 맥 경로 설정
	} else if (platform === 'win32') {
		// 윈도우 경로 설정
	}
});
