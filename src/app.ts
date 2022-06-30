import express, { Request, Response, NextFunction } from 'express';

const app = express();

app.get('/', (req: Request, res: Response, next: NextFunction) => {
	res.send('hello!');
});

app.listen('8080', () => {
	console.log(`
  ################################################
  🛡️  Server listening on port: 8080 🛡️
  ################################################
`);
});
