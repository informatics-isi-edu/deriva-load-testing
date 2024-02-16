# Artillery

## Overview

- https://www.artillery.io/
- Allows us to run “scenarios” on defined “phases”
  - “scenarios” can be playwright tests, so we don’t need to write extra code for this part of it.
  - “Phases”: It allows us to run the test on however many users that we want. We can simulate user load easily with this.
- We can run it on a single machine, but it might not produce accurate results (as we’re going to be limited by how busy that machine is and how many users it can handle)
- It has built-in support for AWS lambda and AWS fargate
  - https://www.artillery.io/docs/load-testing-at-scale
  - We just need to make sure the user that is running the artillery command has proper AWS credentials. This tool will create the AWS resources on demand.


## How to run

To run the script, you first need to install the dependencies,

```
npm clean-install
```

And then run the following

```
npx artillery run deriva-load-test.yml
```
