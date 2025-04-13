import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/logo";
import { WaveBackground } from "@/components/ui/wave-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Redirect } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export default function AuthPage() {
  const [isLoginForm, setIsLoginForm] = useState(true);
  const { user, loginMutation, registerMutation } = useAuth();
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },
  });
  
  const handleLogin = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };
  
  const handleSignup = (data: SignupFormValues) => {
    registerMutation.mutate(data);
  };
  
  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <WaveBackground className="flex flex-col justify-center items-center px-4">
      <div className="flex items-center mb-8">
        <Logo size="lg" />
      </div>
      
      {isLoginForm ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#CC2121] dark:text-[#FF5252]">Login</h2>
          
          <form onSubmit={loginForm.handleSubmit(handleLogin)}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email:
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...loginForm.register("email")}
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-600"
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password:
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...loginForm.register("password")}
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-600"
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-[#CC2121] hover:bg-[#AA0000] text-white rounded-lg py-3 font-medium mt-6"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
          
          <div className="text-center mt-4">
            <Button variant="link" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#CC2121]">
              Forgot Password?
            </Button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Button
                variant="link"
                className="text-[#CC2121] hover:underline font-semibold p-0"
                onClick={() => setIsLoginForm(false)}
              >
                Sign Up
              </Button>
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#CC2121] dark:text-[#FF5252]">Sign Up</h2>
          
          <form onSubmit={signupForm.handleSubmit(handleSignup)}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name:
                </Label>
                <Input
                  id="name"
                  type="text"
                  {...signupForm.register("name")}
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-600"
                />
                {signupForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {signupForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username:
                </Label>
                <Input
                  id="username"
                  type="text"
                  {...signupForm.register("username")}
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-600"
                />
                {signupForm.formState.errors.username && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {signupForm.formState.errors.username.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email:
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  {...signupForm.register("email")}
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-600"
                />
                {signupForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {signupForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password:
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  {...signupForm.register("password")}
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-600"
                />
                {signupForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-[#CC2121] hover:bg-[#AA0000] text-white rounded-lg py-3 font-medium mt-6"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Signing up..." : "Sign Up"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already Registered?{" "}
              <Button
                variant="link"
                className="text-[#CC2121] hover:underline font-semibold p-0"
                onClick={() => setIsLoginForm(true)}
              >
                Login
              </Button>
            </p>
          </div>
        </div>
      )}
    </WaveBackground>
  );
}
