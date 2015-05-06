package engine

import (
	"fmt"
	"math/rand"
	"sync"
	"testing"

	"github.com/keybase/client/go/libkb"
)

// TestConcurrentLogin tries calling logout, login, and many of
// the exposed methods in LoginState concurrently.  Use the
// -race flag to test it.
func TestConcurrentLogin(t *testing.T) {
	// making it skip by default since it is slow...
	t.Skip("Skipping ConcurrentLogin test")
	tc := SetupEngineTest(t, "login")
	defer tc.Cleanup()

	u := CreateAndSignupFakeUser(tc, "login")

	var lwg sync.WaitGroup
	var mwg sync.WaitGroup

	done := make(chan bool)

	for i := 0; i < 10; i++ {
		lwg.Add(1)
		go func(index int) {
			defer lwg.Done()
			for j := 0; j < 4; j++ {
				tc.G.Logout()
				u.LoginOrBust(tc)
			}
			fmt.Printf("logout/login #%d done\n", index)
		}(i)

		mwg.Add(1)
		go func(index int) {
			defer mwg.Done()
			for {
				select {
				case <-done:
					fmt.Printf("func caller %d done\n", index)
					return
				default:
					tc.G.LoginState().SessionArgs()
					tc.G.LoginState().UserInfo()
					tc.G.LoginState().UID()
					tc.G.LoginState().SessionLoad()
					tc.G.LoginState().IsLoggedIn()
					tc.G.LoginState().IsLoggedInLoad()
					tc.G.LoginState().AssertLoggedIn()
					tc.G.LoginState().AssertLoggedOut()
					// tc.G.LoginState.Shutdown()
					tc.G.LoginState().GetCachedTriplesec()
					tc.G.LoginState().GetCachedPassphraseStream()
				}
			}
		}(i)
	}

	lwg.Wait()
	close(done)
	mwg.Wait()
}

// TestConcurrentGetPassphraseStream tries calling logout, login,
// and GetPassphraseStream to check for race conditions.
// Use the -race flag to test it.
func TestConcurrentGetPassphraseStream(t *testing.T) {
	// making it skip by default since it is slow...
	t.Skip("Skipping ConcurrentGetPassphraseStream test")
	tc := SetupEngineTest(t, "login")
	defer tc.Cleanup()

	u := CreateAndSignupFakeUser(tc, "login")

	var lwg sync.WaitGroup
	var mwg sync.WaitGroup

	done := make(chan bool)

	for i := 0; i < 10; i++ {
		lwg.Add(1)
		go func(index int) {
			defer lwg.Done()
			for j := 0; j < 4; j++ {
				tc.G.Logout()
				u.LoginOrBust(tc)
			}
			fmt.Printf("logout/login #%d done\n", index)
		}(i)

		mwg.Add(1)
		go func(index int) {
			defer mwg.Done()
			for {
				select {
				case <-done:
					fmt.Printf("func caller %d done\n", index)
					return
				default:
					_, err := tc.G.LoginState().GetPassphraseStream(u.NewSecretUI())
					if err != nil {
						tc.G.Log.Warning("GetPassphraseStream err: %s", err)
					}
				}
			}
		}(i)
	}

	lwg.Wait()
	close(done)
	mwg.Wait()
}

// TestConcurrentLogin tries calling logout, login, and many of
// the exposed methods in LoginState concurrently.  Use the
// -race flag to test it.
func TestConcurrentSignup(t *testing.T) {
	// making it skip by default since it is slow...
	t.Skip("Skipping ConcurrentSignup test")
	tc := SetupEngineTest(t, "login")
	defer tc.Cleanup()

	u := CreateAndSignupFakeUser(tc, "login")

	var lwg sync.WaitGroup
	var mwg sync.WaitGroup

	done := make(chan bool)

	for i := 0; i < 10; i++ {
		lwg.Add(1)
		go func(index int) {
			defer lwg.Done()
			for j := 0; j < 4; j++ {
				tc.G.Logout()
				u.Login(tc.G)
				tc.G.Logout()
			}
			fmt.Printf("logout/login #%d done\n", index)
		}(i)

		mwg.Add(1)
		go func(index int) {
			defer mwg.Done()
			CreateAndSignupFakeUser(tc, "login")
			tc.G.Logout()
			fmt.Printf("func caller %d done\n", index)
		}(i)
	}

	lwg.Wait()
	close(done)
	mwg.Wait()
}

// TestConcurrentGlobals tries to find race conditions in
// everything in GlobalContext.
func TestConcurrentGlobals(t *testing.T) {
	t.Skip("Skipping ConcurrentGlobals")
	tc := SetupEngineTest(t, "login")
	defer tc.Cleanup()

	fns := []func(*libkb.GlobalContext){
		genv,
	}
	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(index int) {
			for j := 0; j < 10; j++ {
				f := fns[rand.Intn(len(fns))]
				f(tc.G)
			}
			wg.Done()
		}(i)
	}
	wg.Wait()
}

func genv(g *libkb.GlobalContext) {
	g.Env.GetConfig()
	g.Env.GetConfigWriter()
	g.Env.GetCommandLine()
	g.Env.SetConfig(libkb.NewJsonConfigFile(""))
	g.Env.SetConfigWriter(libkb.NewJsonConfigFile(""))
}

func gkeyring() {

}
