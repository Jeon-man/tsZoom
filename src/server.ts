import express, { Request, Response, NextFunction } from "express";
import { Server } from "socket.io";

const app = express();

interface ServerToClientEvents {
  noArg: () => void;
  welcome: () => void;
  offer: (offer: any) => void;
}

interface ClientToServerEvents {
  join_room: (roomName: string[], done: any) => void;
  offer: (offer: any, roomName: string[]) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  name: string;
  age: number;
}

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

app.get("/welcome", (req: Request, res: Response, next: NextFunction) => {
  res.send("welcome!");
});

app.get("/", (req: Request, res: Response) => {
  res.render("home");
});

io.on("connection", (socket) => {
  socket.on("join_room", (roomName: string[], done: () => void) => {
    socket.join(roomName);
    done();
    socket.to(roomName).emit("welcome");
  });

  socket.on("offer", (offer: any, roomName: string[]) => {
    socket.to(roomName).emit("offer", offer);
  });
});

app.listen("3000", () => {
  console.log("http://localhost:3000");
});
