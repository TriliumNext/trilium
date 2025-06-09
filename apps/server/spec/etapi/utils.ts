import type { Application } from "express";
import supertest from "supertest";
import { expect } from "vitest";

export async function login(app: Application) {
    // Obtain auth token.
    const response = await supertest(app)
        .post("/etapi/auth/login")
        .send({
            "password": "demo1234"
        })
        .expect(201);
    const token = response.body.authToken;
    expect(token).toBeTruthy();
    return token;
}

export async function createNote(app: Application, token: string, content?: string) {
    const response = await supertest(app)
        .post("/etapi/create-note")
        .auth("etapi", token, { "type": "basic"})
        .send({
            "parentNoteId": "root",
            "title": "Hello",
            "type": "text",
            "content": content ?? "Hi there!",
        })
        .expect(201);

    const noteId = response.body.note.noteId as string;
    expect(noteId).toStrictEqual(noteId);
    return noteId;
}
