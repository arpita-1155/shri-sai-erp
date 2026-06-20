"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2 } from "lucide-react";
import { toast } from "sonner"; // Imported sonner

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.warning("Please enter your email address first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      toast.error("Failed to send reset email. Ensure the email is correct.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-blue-100">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-slate-900">Shri Sai ERP</CardTitle>
          <CardDescription className="text-lg text-slate-600">
            Welcome back. Please login to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg font-semibold text-slate-800">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@shrisai.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-lg p-6"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-lg font-semibold text-slate-800">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-lg p-6"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="h-6 w-6"
                />
                <Label htmlFor="remember" className="text-lg cursor-pointer text-slate-700">Remember me</Label>
              </div>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="text-blue-600 hover:text-blue-800 font-semibold text-lg"
              >
                Forgot Password?
              </button>
            </div>

            <Button 
              type="submit" 
              className="w-full text-xl py-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Secure Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}