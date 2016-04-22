// FixtureList
//     Fixture

// Table
//     TableRow

var LeagueSelect = React.createClass({
    handleChange: function(event) {
        this.props.handleLeagueChange(event.target.value);
    },

    render: function() {
        return (
            <div className="leagueSelect form-group">
                <label for="league">Select League</label>
                <select
                    id="league"
                    className="league"
                    onChange={this.handleChange}
                    autoFocus={true}>
                    <option value="EPL">EPL</option>
                </select>
            </div>
        );
    }
});

var FixtureList = React.createClass({
    render: function() {
        var seenDates = [];
        var fixtures = [];

        this.props.fixtures.forEach(function(f, i) {
            var date = moment(f.date).format('dddd, MMMM Do YYYY');

            if(seenDates.indexOf(date) === -1) {
                seenDates.push(date);
                fixtures.push(<h4 key={fixtures.length}>{date}</h4>);
                fixtures.push(<Fixture key={fixtures.length} fixture={f} updateFixture={this.props.updateFixture} />);
            } else {
                fixtures.push(<Fixture key={fixtures.length} fixture={f} updateFixture={this.props.updateFixture} />);
            }
        }, this);

        return (
            <div className="fixtureList">
                {fixtures}
            </div>
        );
    }
});

var Fixture = React.createClass({
    updateScore: function(event) {
        var parent = event.target.parentElement;
        var homeScore = parent.getElementsByClassName('homeTeamScore')[0].value;
        var awayScore = parent.getElementsByClassName('awayTeamScore')[0].value;

        this.props.fixture.result.goalsHomeTeam = homeScore;
        this.props.fixture.result.goalsAwayTeam = awayScore;

        homeScore = parseInt(homeScore, 10);
        awayScore = parseInt(awayScore, 10);

        if(!Number.isNaN(homeScore) && !Number.isNaN(awayScore)) {
            this.props.updateFixture(this.props.fixture.homeTeamName, this.props.fixture.awayTeamName, homeScore, awayScore);
        } else {
            this.props.updateFixture(this.props.fixture.homeTeamName, this.props.fixture.awayTeamName, null, null);
        }
    },

    render: function() {
        var finished = this.props.fixture.status === "FINISHED";
        var homeTeamGoals = this.props.fixture.result.goalsHomeTeam === null ? '' : this.props.fixture.result.goalsHomeTeam;
        var awayTeamGoals = this.props.fixture.result.goalsAwayTeam === null ? '' : this.props.fixture.result.goalsAwayTeam;

        return (
            <div className="fixture">
                <span className="homeTeam">{this.props.fixture.homeTeamName}</span>
                <input className="homeTeamScore score" type="text" defaultValue={homeTeamGoals} onChange={this.updateScore} />
                <span className="separator">v</span>
                <input className="awayTeamScore score" type="text" defaultValue={awayTeamGoals} onChange={this.updateScore} />
                <span className="awayTeam">{this.props.fixture.awayTeamName}</span>
            </div>
        );
    }
});

var Table = React.createClass({
    render: function() {
        var rows = this.props.season.map(function(team, i) {
            var state;

            if(i === 0) {
                state = 'CHAMPIONS';
            } else if(i <= 3) {
                state = 'CLEAGUE';
            } else if(i > this.props.season.length - 4) {
                state = 'RELEGATED';
            }

            return (<TableRow key={team.name} index={i} team={team} state={state}/>);
        }, this);

        return (
            <table className="table table-striped table-condensed table-hover">
                <thead>
                    <tr>
                        <th>Pos</th>
                        <th>Team</th>
                        <th>P</th>
                        <th>W</th>
                        <th>D</th>
                        <th>L</th>
                        <th>F</th>
                        <th>A</th>
                        <th>GD</th>
                        <th>Pts</th>
                    </tr>
                </thead>

                <tbody>
                    {rows}
                </tbody>
            </table>
        )
    }
});

var TableRow = React.createClass({
    render: function() {
        var className = this.props.state === 'CHAMPIONS' ? 'success' :
            this.props.state === 'CLEAGUE' ? 'info' :
            this.props.state === 'RELEGATED' ? 'danger' : '';

        return (
            <tr className={className}>
                <td>{this.props.index + 1}</td>
                <td>{this.props.team.name}</td>
                <td>{this.props.team.played}</td>
                <td>{this.props.team.won}</td>
                <td>{this.props.team.drawn}</td>
                <td>{this.props.team.lost}</td>
                <td>{this.props.team.goalsFor}</td>
                <td>{this.props.team.goalsAgainst}</td>
                <td>{this.props.team.goalDifference}</td>
                <td>{this.props.team.points}</td>
            </tr>
        );
    }
});

var App = React.createClass({
    getInitialState: function() {
        return {
            league: "EPL",
            pastFixtures: [],
            upcomingFixtures: [],
            season: []
        };
    },

    componentDidMount: function() {
        this.fetchFixtures();
    },

    updateFixture: function(homeName, awayName, home, away) {
        var combinedFixtures = this.state.pastFixtures.concat(this.state.upcomingFixtures);

        var newFixtures = combinedFixtures.map(function(fixture, i) {
            var newFixture = fixture;

            if(fixture.homeTeamName === homeName && fixture.awayTeamName === awayName) {
                if(home === null && away === null) {
                    newFixture.status = 'TIMED';
                } else {
                    newFixture.status = 'FINISHED';    
                }
                
                newFixture.result = {
                    goalsHomeTeam: home,
                    goalsAwayTeam: away
                };
            };

            return newFixture;
        });

        this.processFixtures(newFixtures);
    },

    fetchFixtures: function() {
        var leagueKeys = {
            "EPL": 398
        };

        var season = leagueKeys[this.state.league];

        $.ajax({
          headers: { 'X-Auth-Token': 'f0f590684cb747f79c0339bc46b51c8b' },
          url: 'http://api.football-data.org/v1/soccerseasons/' + season + '/fixtures',
          dataType: 'json',
          type: 'GET',
        }).done(function(response) {
            // console.log(response.fixtures);
            this.processFixtures(response.fixtures);
        }.bind(this));
    },

    processFixtures: function(fixtures) {
        var season = []; 
        var indexMap = {};

        var pastFixtures = [];
        var upcomingFixtures = [];

        fixtures.forEach(function(f) {
            [f.homeTeamName, f.awayTeamName].forEach(function(name) {
                if(indexMap[name] == null) {
                    indexMap[name] = season.length;

                    season.push({
                        name: name,
                        played: 0,
                        won: 0,
                        lost: 0,
                        drawn: 0,
                        points: 0,
                        goalsFor: 0,
                        goalsAgainst: 0,
                        goalDifference: 0
                    });
                }
            });

            // add points to the winner (or 1 each in draw)
            if(f.status === 'FINISHED') {
                var home = season[indexMap[f.homeTeamName]];
                var away = season[indexMap[f.awayTeamName]];

                home.played++;
                away.played++;

                if(f.result.goalsHomeTeam > f.result.goalsAwayTeam) {
                    home.won++;
                    home.points += 3;
                    away.lost++;
                } else if(f.result.goalsHomeTeam === f.result.goalsAwayTeam) {
                    home.drawn++;
                    away.drawn++;
                    home.points += 1;
                    away.points += 1;
                } else {
                    away.won++;
                    away.points += 3;
                    home.lost++;
                }

                home.goalsFor += f.result.goalsHomeTeam;
                home.goalsAgainst += f.result.goalsAwayTeam;
                away.goalsFor += f.result.goalsAwayTeam;
                away.goalsAgainst += f.result.goalsHomeTeam;

                home.goalDifference = home.goalsFor - home.goalsAgainst;
                away.goalDifference = away.goalsFor - away.goalsAgainst; 
            }

            var obj = {
                awayTeamName: f.awayTeamName,
                date: f.date,
                homeTeamName: f.homeTeamName,
                matchday: f.matchday,
                result: f.result,
                status: f.status
            };

            if(Date.parse(f.date) > Date.now()) {
                upcomingFixtures.push(obj);
            } else {
                pastFixtures.push(obj);
            }
        });

        season.sort(function(a, b) {
            if(a.points < b.points) {
                return 1;
            } else if(a.points > b.points) {
                return -1;
            } else {
                if(a.goalDifference < b.goalDifference) {
                    return 1;
                } else if(a.goalDifference > b.goalDifference) {
                    return -1;
                } else {
                    return 0;
                }
            }
        });

        upcomingFixtures.sort(function(a, b) {
            var aDate = Date.parse(a.date);
            var bDate = Date.parse(b.date);

            if(aDate < bDate) {
                return -1;
            } else if(aDate > bDate) {
                return 1;
            } else {
                return a.homeTeamName.localeCompare(b.homeTeamName);
            }

            return aDate < bDate ? 1 : aDate > bDate ? -1 : 0;
        });


        pastFixtures.sort(function(a, b) {
            var aDate = Date.parse(a.date);
            var bDate = Date.parse(b.date);

            if(aDate < bDate) {
                return 1;
            } else if(aDate > bDate) {
                return -1;
            } else {
                return a.homeTeamName.localeCompare(b.homeTeamName);
            }

            return aDate < bDate ? 1 : aDate > bDate ? -1 : 0;
        });

        this.setState({
            pastFixtures: pastFixtures,
            upcomingFixtures: upcomingFixtures,
            season: season
        });
    },

    handleLeagueChange: function(league) {
        // this.setState({ league: league });
    },

    render: function() {

                // <LeagueSelect league={this.state.league}
                //               handleLeagueChange={this.handleLeagueChange}/>
        return (
            <div className="row">
                <div className="col-md-6">
                    <h3>Upcoming Fixtures</h3>
                    <FixtureList fixtures={this.state.upcomingFixtures}
                             updateFixture={this.updateFixture}/>
                    <h3>Past Fixtures</h3>
                    <FixtureList fixtures={this.state.pastFixtures}
                             updateFixture={this.updateFixture}/>
                </div>
                <div className="col-md-6">
                    <h3>Live Table</h3>
                    <Table season={this.state.season} />
                </div>
            </div>
        );
    }
});

ReactDOM.render(
    <App />,
    document.getElementById('container')
);