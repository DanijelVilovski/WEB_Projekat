import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

import { AuthData } from './auth-data.model';

@Injectable({providedIn: 'root'})
export class AuthService {
    private isAuthenticated = false;
    private isAdmin = false;
    private token: string | undefined;
    private tokenTimer: any;
    private authStatusListener = new Subject<boolean>();
    private isAdminListener = new Subject<boolean>();

    constructor(private http: HttpClient, private router: Router) {}

    getToken() {
        return this.token;
    }

    getIsAuth() {
        return this.isAuthenticated;
    }

    getAuthStatusListener() {
        return this.authStatusListener.asObservable();
    }

    getIsAdminListener() {
        return this.isAdminListener.asObservable();
    }

    createUser(email: string, password: string, fullName: string){
        const authData: AuthData = {email: email, password: password, fullName: fullName};
        this.http.post("http://localhost:3000/api/user/signup", authData)
            .subscribe(() => {
                this.router.navigate(["/login"]);
            }, error => {
                this.authStatusListener.next(false);
            });
    }

    login(email: string, password: string) {
        const authData: AuthData = {email: email, password: password, fullName: ''};
        this.http.post<{token: string, expiresIn: number, isAdmin: boolean, fullName: string}>("http://localhost:3000/api/user/login", authData)
            .subscribe(response => {
                const token = response.token;
                const isAdmin = response.isAdmin;
                const fullName = response.fullName;
                this.token = token;
                if (token) {
                    //nakon 3600 sekundi ce sesija isteci i dolazi do logouta
                    const expiresInDuration = response.expiresIn;
                    this.isAdmin = isAdmin;
                    this.setAuthTimer(expiresInDuration);
                    this.isAuthenticated = true;
                    this.authStatusListener.next(true);
                    this.isAdminListener.next(this.isAdmin);
                    const now = new Date();
                    const expirationDate = new Date(now.getTime() + expiresInDuration * 1000); 
                    this.saveAuthData(token, expirationDate, isAdmin, fullName);
                    this.router.navigate(["/"]);
                } 
            }, error => {
                this.authStatusListener.next(false);
            });
    }

    autoAuthUser() {
        const authInformation = this.getAuthData();
        if (!authInformation) {
            return;
        }
        const now = new Date();
        const expiresIn = authInformation.expirationDate.getTime() - now.getTime();
        if (expiresIn > 0) {
            this.token = authInformation?.token;
            this.isAuthenticated = true;
            this.setAuthTimer(expiresIn / 1000);
            this.authStatusListener.next(true);
        }
    }

    logout() {
        this.token = "";
        this.isAuthenticated = false;
        this.authStatusListener.next(false);
        this.isAdminListener.next(false);
        clearTimeout(this.tokenTimer);
        this.clearAuthData();
        this.router.navigate(["/"]);
        
    }

    private setAuthTimer(duration: number) {
        console.log("Setting timer: " + duration)
        this.tokenTimer = setTimeout(() => {
            this.logout();
        }, duration * 1000);
    }

    private saveAuthData(token: string, expirationDate: Date, isAdmin: boolean, fullName: string) {
        localStorage.setItem("token", token);
        localStorage.setItem("expiration", expirationDate.toISOString());
        localStorage.setItem("isAdmin",  new Boolean(this.isAdmin).toString());
        localStorage.setItem("fullName", fullName);
    }

    private clearAuthData() {
        localStorage.removeItem("token");
        localStorage.removeItem("expiration");
        localStorage.removeItem("isAdmin");
    }

    private getAuthData() {
        const token = localStorage.getItem("token");
        const expirationDate = localStorage.getItem("expiration");
        if (!token || !expirationDate) {
            return;
        } 
        return {
            token: token,
            expirationDate: new Date(expirationDate)
        }
    }

}