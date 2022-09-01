const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');

const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const users = require('./Users.json');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const DATETIME_PROMPT = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog = '';

class MakeReservationDialog extends ComponentDialog {
    constructor(conservsationState, userState) {
        super('makeReservationDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT, this.noOfParticipantsValidator));
        this.addDialog(new DateTimePrompt(DATETIME_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.firstStep.bind(this), // Ask confirmation if user wants to make reservation?
            this.getName.bind(this),
            this.getSecureQuestion.bind(this), // Get name from user
            this.getNumberOfParticipants.bind(this), // Number of participants for reservation
            this.getDate.bind(this), // Date of reservation
            this.getTime.bind(this),
            this.getDuration.bind(this), // Time of reservation
            this.getAvailRoom.bind(this), // Time of reservation
            this.confirmStep.bind(this), // Show summary of values entered by user and ask confirmation to make reservation
            this.summaryStep.bind(this)

        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async firstStep(step) {
        endDialog = false;
        // Running a prompt here means the next WaterfallStep will be run when the users response is received.
        return await step.prompt(CONFIRM_PROMPT, 'Would you like to make a booking?', ['yes', 'no']);
    }

    async getName(step) {
        console.log(step.result);
        if (step.result === true) {
            // step.values.name = step.result;
            return await step.prompt(TEXT_PROMPT, 'Please provide your Userid?');
        }
    }

    async getSecureQuestion(step) {
        console.log(step.result);
        if (step.result) {
            step.values.name = step.result;
            // let question = users.map(e =>{ if(e.userid == step.result) return e.securityquestion});
            var question = users.filter(e => parseInt(e.userid) === parseInt(step.result));
            if (question.length) {
                question = question[0];
                step.values.check_answer = question.answer;
                await step.context.sendActivity('Please answer your security question below');
                return await step.prompt(TEXT_PROMPT, ` ${ question.securityquestion }`);
            }
        }
    }

    async getNumberOfParticipants(step) {
        step.values.answer = step.result;
        console.log(step);
        if (step.values.check_answer === step.result) {
            return await step.prompt(NUMBER_PROMPT, 'How many participants ( 1 - 150)?');
        }
    }

    async getDate(step) {
        step.values.noOfParticipants = step.result;

        return await step.prompt(DATETIME_PROMPT, 'Please select the date of the meeting');
    }

    async getTime(step) {
        step.values.date = step.result;

        return await step.prompt(DATETIME_PROMPT, 'Please choose the meeting time?');
    }

    async getDuration(step) {
        step.values.time = step.result;

        return await step.prompt(DATETIME_PROMPT, 'Please choose the duration?');
    }

    async getAvailRoom(step) {
        step.values.duration = step.result;
        console.log(step.values.duration);

        return await step.prompt(CHOICE_PROMPT, 'Please select from the available meeting rooms?', ['MR1', 'MR2']);
    }

    async confirmStep(step) {
        step.values.availRoom = step.result;
        console.log(step.values.availRoom);
        var msg = ` You have entered following values: \r\n userId: ${ step.values.name }\r\n Participants: ${ step.values.noOfParticipants }\r\n Date: ${ JSON.stringify(step.values.date) }\r\n Time: ${ JSON.stringify(step.values.time) } \r\n duration: ${ JSON.stringify(step.values.duration) } \r\n Room: ${ step.values.availRoom.value } `;

        await step.context.sendActivity(msg);

        return await step.prompt(CONFIRM_PROMPT, 'Are you sure that all values are correct and you want to make the booking?', ['yes', 'no']);
    }

    async summaryStep(step) {
        if (step.result === true) {
            // Business

            await step.context.sendActivity(' Your Meeting Booking successfully made. \r\n Thank you.Have a nice day..');
            endDialog = true;
            return await step.endDialog();
        }
    }

    async noOfParticipantsValidator(promptContext) {
    // This condition is our validation rule. You can also change the value at this point.
        return promptContext.recognized.succeeded && promptContext.recognized.value > 1 && promptContext.recognized.value < 150;
    }

    async isDialogComplete() {
        return endDialog;
    }
}

module.exports.MakeReservationDialog = MakeReservationDialog;
